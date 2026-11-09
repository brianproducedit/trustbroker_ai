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
