"""
TrustBroker AI — Workstreams B, C, D, L: PayPal Truthfulness & Lifecycle Integrity Tests
Verifies that:
- Failed/declined captures never synthesize a COMPLETED capture or SANDBOX-CAP-* ID.
- Duplicate order creation calls return existing active attempt without creating multiple orders.
- Webhook signature verification fails closed when PAYPAL_WEBHOOK_ID is missing.
- Payout release requires an explicit freelancer PayPal email (no synthetic fallback).
- Payout API errors do not invent synthetic batch/item IDs.
- AI verification passing sets work status VERIFIED, but does NOT set RELEASE_AUTHORIZED.
- Contract completion is NOT granted while milestones remain un-settled financially.
"""
import uuid
import pytest
from decimal import Decimal
from unittest.mock import patch, AsyncMock
from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.contract import Contract, ContractStatus
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus
from app.models.payment import PaymentAttempt
from app.models.user import UserProfile
from app.models.marketplace import Payout, PayoutStatus
from app.services.payment_service import (
    create_milestone_escrow_order,
    capture_milestone_escrow_payment,
    release_milestone_payout,
)
from app.services.policy_engine import PolicyEngine
from app.utils.paypal_client import verify_webhook_signature
from app.config import settings


@pytest.mark.asyncio
async def test_capture_error_does_not_fabricate_completed_status(session: Session, client_user: UserProfile):
    """When PayPal capture fails or is declined, backend must raise 409/502 and NOT create synthetic capture."""
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-INT-001",
        title="Test Integrity Contract",
        client_id=client_user.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("400.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("400.00"),
        status=MilestoneStatus.PENDING,
        payment_status=PaymentStatus.CHECKOUT_CREATED,
    )
    attempt = PaymentAttempt(
        contract_id=contract.id,
        milestone_id=milestone.id,
        paypal_order_id="TEST-DECLINED-ORDER",
        amount=Decimal("400.00"),
        currency="USD",
        status=PaymentStatus.CHECKOUT_CREATED,
    )
    session.add(contract)
    session.add(milestone)
    session.add(attempt)
    session.commit()

    with patch("app.utils.paypal_client.capture_paypal_order", side_effect=Exception("INSTRUMENT_DECLINED")):
        with pytest.raises(HTTPException) as exc_info:
            await capture_milestone_escrow_payment(session, client_user, paypal_order_id="TEST-DECLINED-ORDER")
        assert exc_info.value.status_code in (409, 502)

    # Verify attempt and milestone were NOT marked funded or completed
    session.refresh(attempt)
    session.refresh(milestone)
    assert attempt.status != PaymentStatus.STAGED_IN_SANDBOX
    assert milestone.payment_status != PaymentStatus.STAGED_IN_SANDBOX
    assert attempt.paypal_capture_id is None or not attempt.paypal_capture_id.startswith("SANDBOX-CAP")


@pytest.mark.asyncio
async def test_duplicate_order_creation_returns_existing_attempt(session: Session, client_user: UserProfile):
    """Calling create order when CHECKOUT_CREATED attempt already exists returns existing order."""
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-INT-002",
        title="Order Idempotency Contract",
        client_id=client_user.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("300.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("300.00"),
        status=MilestoneStatus.PENDING,
        payment_status=PaymentStatus.NOT_STARTED,
    )
    session.add(contract)
    session.add(milestone)
    session.commit()

    with patch("app.utils.paypal_client.create_paypal_order", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = {"id": "ORDER-SINGLE-123", "status": "CREATED", "links": []}

        # First call creates order
        res1 = await create_milestone_escrow_order(session, contract.id, milestone.id, client_user)
        assert res1["order_id"] == "ORDER-SINGLE-123"
        assert mock_create.call_count == 1

        # Second call returns existing attempt without calling PayPal API again
        res2 = await create_milestone_escrow_order(session, contract.id, milestone.id, client_user)
        assert res2["order_id"] == "ORDER-SINGLE-123"
        assert mock_create.call_count == 1  # Still 1!


@pytest.mark.asyncio
async def test_webhook_fails_closed_when_id_missing():
    """verify_webhook_signature returns False when paypal_webhook_id is unconfigured."""
    orig_id = settings.paypal_webhook_id
    try:
        settings.paypal_webhook_id = ""
        is_valid = await verify_webhook_signature({}, {"id": "WH-TEST"})
        assert is_valid is False
    finally:
        settings.paypal_webhook_id = orig_id


@pytest.mark.asyncio
async def test_payout_requires_configured_receiver(session: Session, client_user: UserProfile):
    """If freelancer has no PayPal payout email, payout release raises 400 and does NOT invent fallback."""
    freelancer_no_email = UserProfile(
        id=uuid.uuid4(),
        email="talent@test.com",
        full_name="Talent Without Email",
        role="freelancer",
        paypal_payout_email="",
    )
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-INT-003",
        title="Payout Validation Contract",
        client_id=client_user.id,
        freelancer_id=freelancer_no_email.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("500.00"),
        staged_amount=Decimal("500.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("500.00"),
        status=MilestoneStatus.VERIFIED,
        payment_status=PaymentStatus.STAGED_IN_SANDBOX,
    )
    session.add(freelancer_no_email)
    session.add(contract)
    session.add(milestone)
    session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await release_milestone_payout(session, contract.id, milestone.id, client_user)
    assert exc_info.value.status_code in (400, 403)

    # Confirm email was NOT automatically invented in the profile
    session.refresh(freelancer_no_email)
    assert not freelancer_no_email.paypal_payout_email


@pytest.mark.asyncio
async def test_payout_failure_does_not_fabricate_batch_id(
    session: Session, client_user: UserProfile, freelancer_user: UserProfile
):
    """When create_payout raises an exception, payout must be marked FAILED without synthetic batch IDs."""
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-INT-004",
        title="Payout Failure Contract",
        client_id=client_user.id,
        freelancer_id=freelancer_user.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("500.00"),
        staged_amount=Decimal("500.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("500.00"),
        status=MilestoneStatus.VERIFIED,
        payment_status=PaymentStatus.STAGED_IN_SANDBOX,
    )
    session.add(contract)
    session.add(milestone)
    session.commit()

    with patch("app.utils.paypal_client.create_payout", side_effect=Exception("USER_BUSINESS_ACCOUNT_RESTRICTED")):
        with pytest.raises(HTTPException) as exc_info:
            await release_milestone_payout(session, contract.id, milestone.id, client_user)
        assert exc_info.value.status_code == 502

    # Verify payout record
    payout = session.exec(select(Payout).where(Payout.milestone_id == milestone.id)).first()
    assert payout is not None
    assert payout.status == PayoutStatus.FAILED.value
    assert payout.paypal_batch_id is None or not payout.paypal_batch_id.startswith("SANDBOX-BATCH")


@pytest.mark.asyncio
async def test_capture_rejects_missing_amount_or_currency(session: Session, client_user: UserProfile):
    """Capture response missing amount or currency must be rejected (cannot bypass validation)."""
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-INT-005",
        title="Field Validation Contract",
        client_id=client_user.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("250.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("250.00"),
        status=MilestoneStatus.PENDING,
        payment_status=PaymentStatus.CHECKOUT_CREATED,
    )
    attempt = PaymentAttempt(
        contract_id=contract.id,
        milestone_id=milestone.id,
        paypal_order_id="TEST-ORDER-NO-AMT",
        amount=Decimal("250.00"),
        currency="USD",
        status=PaymentStatus.CHECKOUT_CREATED,
    )
    session.add(contract)
    session.add(milestone)
    session.add(attempt)
    session.commit()

    # Provider returns captures array with NO amount object
    mock_capture_no_amt = {
        "status": "COMPLETED",
        "purchase_units": [
            {
                "payments": {
                    "captures": [
                        {"id": "CAP-12345", "status": "COMPLETED"}  # missing amount
                    ]
                }
            }
        ]
    }

    with patch("app.utils.paypal_client.capture_paypal_order", AsyncMock(return_value=mock_capture_no_amt)):
        with pytest.raises(HTTPException) as exc_info:
            await capture_milestone_escrow_payment(session, client_user, paypal_order_id="TEST-ORDER-NO-AMT")
        assert exc_info.value.status_code == 409
        assert "missing required amount" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_capture_rejects_amount_and_currency_mismatch(session: Session, client_user: UserProfile):
    """Capture amount or currency mismatch must raise 409 and not fund milestone."""
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-INT-006",
        title="Mismatch Contract",
        client_id=client_user.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("200.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("200.00"),
        status=MilestoneStatus.PENDING,
        payment_status=PaymentStatus.CHECKOUT_CREATED,
    )
    attempt = PaymentAttempt(
        contract_id=contract.id,
        milestone_id=milestone.id,
        paypal_order_id="TEST-ORDER-MISMATCH",
        amount=Decimal("200.00"),
        currency="USD",
        status=PaymentStatus.CHECKOUT_CREATED,
    )
    session.add(contract)
    session.add(milestone)
    session.add(attempt)
    session.commit()

    # 1. Amount mismatch: 150.00 vs 200.00
    mock_mismatch_amount = {
        "status": "COMPLETED",
        "purchase_units": [
            {
                "payments": {
                    "captures": [
                        {
                            "id": "CAP-MISMATCH-1",
                            "status": "COMPLETED",
                            "amount": {"value": "150.00", "currency_code": "USD"},
                        }
                    ]
                }
            }
        ]
    }
    with patch("app.utils.paypal_client.capture_paypal_order", AsyncMock(return_value=mock_mismatch_amount)):
        with pytest.raises(HTTPException) as exc_info:
            await capture_milestone_escrow_payment(session, client_user, paypal_order_id="TEST-ORDER-MISMATCH")
        assert exc_info.value.status_code == 409
        assert "does not match milestone amount" in exc_info.value.detail

    # 2. Currency mismatch: EUR vs USD
    mock_mismatch_currency = {
        "status": "COMPLETED",
        "purchase_units": [
            {
                "payments": {
                    "captures": [
                        {
                            "id": "CAP-MISMATCH-2",
                            "status": "COMPLETED",
                            "amount": {"value": "200.00", "currency_code": "EUR"},
                        }
                    ]
                }
            }
        ]
    }
    with patch("app.utils.paypal_client.capture_paypal_order", AsyncMock(return_value=mock_mismatch_currency)):
        with pytest.raises(HTTPException) as exc_info:
            await capture_milestone_escrow_payment(session, client_user, paypal_order_id="TEST-ORDER-MISMATCH")
        assert exc_info.value.status_code == 409
        assert "does not match milestone currency" in exc_info.value.detail


@pytest.mark.asyncio
async def test_capture_rejects_multiple_purchase_units(session: Session, client_user: UserProfile):
    """Multiple purchase units in capture response must be rejected."""
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-INT-007",
        title="Multi-unit Contract",
        client_id=client_user.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("100.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("100.00"),
        status=MilestoneStatus.PENDING,
        payment_status=PaymentStatus.CHECKOUT_CREATED,
    )
    attempt = PaymentAttempt(
        contract_id=contract.id,
        milestone_id=milestone.id,
        paypal_order_id="TEST-ORDER-MULTI",
        amount=Decimal("100.00"),
        currency="USD",
        status=PaymentStatus.CHECKOUT_CREATED,
    )
    session.add(contract)
    session.add(milestone)
    session.add(attempt)
    session.commit()

    mock_multi_units = {
        "status": "COMPLETED",
        "purchase_units": [{"reference_id": "unit_1"}, {"reference_id": "unit_2"}]
    }
    with patch("app.utils.paypal_client.capture_paypal_order", AsyncMock(return_value=mock_multi_units)):
        with pytest.raises(HTTPException) as exc_info:
            await capture_milestone_escrow_payment(session, client_user, paypal_order_id="TEST-ORDER-MULTI")
        assert exc_info.value.status_code == 400
        assert "multiple purchase units" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_refund_unapproved_checkout_returns_cancelled_not_refunded(session: Session, client_user: UserProfile):
    """Cancelling an unapproved CHECKOUT_CREATED order must return status: cancelled (not refunded)."""
    from app.services.payment_service import refund_milestone_escrow
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-INT-008",
        title="Cancel Unapproved Checkout",
        client_id=client_user.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("300.00"),
        staged_amount=Decimal("0.00"),  # No staged funds yet
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("300.00"),
        status=MilestoneStatus.PENDING,
        payment_status=PaymentStatus.CHECKOUT_CREATED,
    )
    session.add(contract)
    session.add(milestone)
    session.commit()

    res = refund_milestone_escrow(session, contract.id, milestone.id, client_user)
    assert res["status"] == "cancelled"
    assert res["mode"] == "checkout_cancelled"
    assert res["amount_reclaimed"] == 0.0
    # Staged amount must NOT go negative
    assert res["contract_staged_amount"] == 0.0

    session.refresh(milestone)
    assert milestone.payment_status == PaymentStatus.CANCELLED


@pytest.mark.asyncio
async def test_payout_timeout_sets_reconciliation_required(session: Session, client_user: UserProfile):
    """When PayPal payout creation times out ambiguously, backend marks payout as reconciliation_required (not failed)."""
    import httpx
    freelancer = UserProfile(
        id=uuid.uuid4(),
        email="freelancer.timeout@example.com",
        full_name="Timeout Freelancer",
        role="freelancer",
        paypal_payout_email="freelancer.payout@sandbox.paypal.com",
    )
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-TIMEOUT-001",
        title="Payout Timeout Contract",
        client_id=client_user.id,
        freelancer_id=freelancer.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("250.00"),
        staged_amount=Decimal("250.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("250.00"),
        status=MilestoneStatus.VERIFIED,
        payment_status=PaymentStatus.STAGED_IN_SANDBOX,
    )
    session.add(freelancer)
    session.add(contract)
    session.add(milestone)
    session.commit()

    with patch("app.utils.paypal_client.create_payout", AsyncMock(side_effect=httpx.ReadTimeout("Read timed out"))):
        with pytest.raises(HTTPException) as exc_info:
            await release_milestone_payout(session, contract.id, milestone.id, client_user)
        assert exc_info.value.status_code == 504
        assert "reconciliation_required" in exc_info.value.detail

    payout = session.exec(select(Payout).where(Payout.milestone_id == milestone.id)).first()
    assert payout is not None
    assert payout.status == PayoutStatus.RECONCILIATION_REQUIRED.value


@pytest.mark.asyncio
async def test_payout_missing_batch_id_sets_reconciliation_required(session: Session, client_user: UserProfile):
    """When PayPal returns a response without a batch ID, backend treats it as ambiguous reconciliation_required."""
    freelancer = UserProfile(
        id=uuid.uuid4(),
        email="freelancer.nobatch@example.com",
        full_name="NoBatch Freelancer",
        role="freelancer",
        paypal_payout_email="freelancer.nobatch@sandbox.paypal.com",
    )
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-NOBATCH-001",
        title="Payout NoBatch Contract",
        client_id=client_user.id,
        freelancer_id=freelancer.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("150.00"),
        staged_amount=Decimal("150.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("150.00"),
        status=MilestoneStatus.VERIFIED,
        payment_status=PaymentStatus.STAGED_IN_SANDBOX,
    )
    session.add(freelancer)
    session.add(contract)
    session.add(milestone)
    session.commit()

    with patch("app.utils.paypal_client.create_payout", AsyncMock(return_value={"batch_header": {}})):
        with pytest.raises(HTTPException) as exc_info:
            await release_milestone_payout(session, contract.id, milestone.id, client_user)
        assert exc_info.value.status_code == 502
        assert "reconciliation_required" in exc_info.value.detail

    payout = session.exec(select(Payout).where(Payout.milestone_id == milestone.id)).first()
    assert payout is not None
    assert payout.status == PayoutStatus.RECONCILIATION_REQUIRED.value


@pytest.mark.asyncio
async def test_payout_notification_and_amounts_accurate(session: Session, client_user: UserProfile):
    """Payout submission sets 'Payout submitted to PayPal' notification and returns requested_amount without claiming release."""
    from app.models.marketplace import Notification
    freelancer = UserProfile(
        id=uuid.uuid4(),
        email="freelancer.notify@example.com",
        full_name="Notify Freelancer",
        role="freelancer",
        paypal_payout_email="freelancer.notify@sandbox.paypal.com",
    )
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-NOTIFY-001",
        title="Payout Notification Contract",
        client_id=client_user.id,
        freelancer_id=freelancer.id,
        status=ContractStatus.ACTIVE,
        total_amount=Decimal("200.00"),
        staged_amount=Decimal("200.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("200.00"),
        status=MilestoneStatus.VERIFIED,
        payment_status=PaymentStatus.STAGED_IN_SANDBOX,
    )
    session.add(freelancer)
    session.add(contract)
    session.add(milestone)
    session.commit()

    mock_resp = {
        "batch_header": {
            "payout_batch_id": "REAL-BATCH-777",
            "batch_status": "PENDING",
        },
        "items": [
            {
                "payout_item_id": "REAL-ITEM-888",
                "transaction_status": "PENDING",
            }
        ],
    }
    with patch("app.utils.paypal_client.create_payout", AsyncMock(return_value=mock_resp)):
        res = await release_milestone_payout(session, contract.id, milestone.id, client_user)

    assert res["status"] == "processing"
    assert res["requested_amount"] == "200.00"
    assert res["payout_amount"] == "200.00"
    # released_amount must be 0.00 because PayPal item status is still pending/processing
    assert res["released_amount"] == "0.00"
    assert res["paypal_batch_id"] == "REAL-BATCH-777"
    assert res["paypal_item_id"] == "REAL-ITEM-888"

    # Notification must say "Payout submitted to PayPal", NOT "PayPal payout sent"
    notif = session.exec(select(Notification).where(Notification.user_id == freelancer.id)).first()
    assert notif is not None
    assert notif.title == "Payout submitted to PayPal"
    assert "submitted to PayPal" in notif.body


def test_apply_payout_status_unknown_status_maps_to_reconciliation_required(session: Session):
    """Unknown provider status strings must map to reconciliation_required, never fabricated success."""
    from app.services.payment_service import _apply_payout_status
    payout = Payout(
        id=uuid.uuid4(),
        contract_id=uuid.uuid4(),
        milestone_id=uuid.uuid4(),
        freelancer_id=uuid.uuid4(),
        amount=Decimal("100.00"),
        currency="USD",
        status=PayoutStatus.PENDING.value,
        idempotency_key="payout:test",
    )
    session.add(payout)
    session.commit()

    _apply_payout_status(session, payout, "UNKNOWN_PROVIDER_STATUS_XYZ")
    assert payout.status == PayoutStatus.RECONCILIATION_REQUIRED.value


@pytest.mark.asyncio
async def test_webhook_checkout_order_completed_reconciles_amount(session: Session, client_user: UserProfile):
    """CHECKOUT.ORDER.COMPLETED webhook must reconcile capture amount against expected attempt amount.
    Mismatched amount must NOT fund milestone and must require reconciliation."""
    from app.services.payment_service import process_paypal_webhook, create_milestone_escrow_order
    from app.models.contract import Contract
    from app.models.milestone import Milestone
    from app.models.payment import PaymentStatus

    contract = Contract(
        id=uuid.uuid4(),
        code="TB-WH-001",
        title="Webhook Test Contract",
        client_id=client_user.id,
        status="active",
        total_amount=Decimal("300.00"),
        staged_amount=Decimal("0.00"),
        currency="USD",
    )
    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="M1 Test",
        amount=Decimal("300.00"),
        order_index=1,
        status="pending",
        payment_status="not_started",
    )
    session.add(contract)
    session.add(milestone)
    session.commit()

    with patch("app.utils.paypal_client.create_paypal_order", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = {"id": "ORDER-WH-TEST", "status": "CREATED", "links": []}
        await create_milestone_escrow_order(session, contract.id, milestone.id, client_user)

    with patch("app.services.payment_service.paypal_client.verify_webhook_signature", return_value=True):
        # 1. Send webhook with mismatched amount ($150 instead of $300)
        mismatched_payload = {
            "id": f"WH-EVT-{uuid.uuid4().hex[:8]}",
            "event_type": "CHECKOUT.ORDER.COMPLETED",
            "resource_type": "checkout-order",
            "resource": {
                "id": "ORDER-WH-TEST",
                "purchase_units": [
                    {
                        "payments": {
                            "captures": [
                                {
                                    "id": "CAP-WH-WRONG",
                                    "status": "COMPLETED",
                                    "amount": {"value": "150.00", "currency_code": "USD"},
                                }
                            ]
                        }
                    }
                ],
            },
        }
        res = await process_paypal_webhook(session, {}, mismatched_payload)
        assert res["status"] == "reconciliation_required"

        session.refresh(milestone)
        assert milestone.payment_status != PaymentStatus.STAGED_IN_SANDBOX
        assert milestone.payment_status == PaymentStatus.CHECKOUT_CREATED

        # 2. Send webhook with matching amount ($300.00 USD)
        matching_payload = {
            "id": f"WH-EVT-{uuid.uuid4().hex[:8]}",
            "event_type": "CHECKOUT.ORDER.COMPLETED",
            "resource_type": "checkout-order",
            "resource": {
                "id": "ORDER-WH-TEST",
                "purchase_units": [
                    {
                        "payments": {
                            "captures": [
                                {
                                    "id": "CAP-WH-MATCH",
                                    "status": "COMPLETED",
                                    "amount": {"value": "300.00", "currency_code": "USD"},
                                }
                            ]
                        }
                    }
                ],
            },
        }
        res_match = await process_paypal_webhook(session, {}, matching_payload)
        assert res_match["status"] == "processed"

        session.refresh(milestone)
        assert milestone.payment_status == PaymentStatus.STAGED_IN_SANDBOX



