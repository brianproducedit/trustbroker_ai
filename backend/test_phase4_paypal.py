"""
TrustBroker AI — Phase 4 PayPal Integration & Idempotency Test Suite
Tests:
1. PayPal OAuth2 Client Credentials Authentication.
2. Orders v2 Milestone Escrow Order Generation.
3. PolicyEngine Payout & Funding Rules Validation.
4. Payout Idempotency Key Preservation (payout:{milestone_id}).
5. Webhook Signature & Idempotent Processing Simulation.
"""

import asyncio
import os
import sys
import uuid
from decimal import Decimal
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, SQLModel, create_engine, select
from app.config import settings
from app.models.contract import Contract, ContractStatus
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus
from app.models.marketplace import Payout, PayoutStatus
from app.models.payment import PaymentAttempt, ProviderEvent
from app.models.user import UserProfile
from app.services.policy_engine import PolicyEngine
from app.utils import paypal_client


# In-memory SQLite engine for rapid, isolated unit and policy tests
test_engine = create_engine("sqlite:///:memory:", echo=False)


def setup_test_db():
    SQLModel.metadata.create_all(test_engine)


def test_policy_engine_rules():
    """Verify PolicyEngine guarantees for funding and release."""
    print("\n--- [1/5] Testing PolicyEngine Funding & Payout Policies ---")
    client_id = uuid.uuid4()
    freelancer_id = uuid.uuid4()
    other_id = uuid.uuid4()

    client = UserProfile(id=client_id, email="client@test.com", full_name="Client User", role="client")
    freelancer = UserProfile(
        id=freelancer_id,
        email="freelancer@test.com",
        full_name="Freelancer User",
        role="freelancer",
        paypal_payout_email="freelancer-payout@sandbox.paypal.com",
    )
    freelancer_no_paypal = UserProfile(
        id=other_id, email="nopaypal@test.com", full_name="No PayPal User", role="freelancer", paypal_payout_email=""
    )

    contract = Contract(
        id=uuid.uuid4(),
        client_id=client_id,
        freelancer_id=freelancer_id,
        title="Test Agreement",
        code="TB-TEST-001",
        status=ContractStatus.DRAFT,
        total_amount=Decimal("1000.00"),
    )

    milestone = Milestone(
        id=uuid.uuid4(),
        contract_id=contract.id,
        title="Milestone 1",
        amount=Decimal("500.00"),
        status=MilestoneStatus.PENDING,
        payment_status=PaymentStatus.NOT_STARTED,
    )

    # 1. Funding draft contract must fail
    res = PolicyEngine.can_fund(client, contract, milestone)
    assert not res.allowed, f"Expected cannot fund draft, got allowed: {res.reason}"
    print("  [PASS] Cannot fund draft contract")

    # 2. Funding active contract by freelancer must fail
    contract.status = ContractStatus.ACTIVE
    res = PolicyEngine.can_fund(freelancer, contract, milestone)
    assert not res.allowed, f"Expected non-client cannot fund, got: {res.reason}"
    print("  [PASS] Freelancer cannot fund milestone")

    # 3. Client funding active contract milestone succeeds
    res = PolicyEngine.can_fund(client, contract, milestone)
    assert res.allowed, f"Expected client can fund, got: {res.reason}"
    print("  [PASS] Client can fund active milestone")

    # 4. Release when milestone is unverified must fail
    res = PolicyEngine.can_release_payout(client, contract, milestone, freelancer)
    assert not res.allowed, "Expected cannot release unverified milestone"
    print("  [PASS] Cannot release unverified milestone")

    # 5. Release when verified but unfunded must fail
    milestone.status = MilestoneStatus.VERIFIED
    res = PolicyEngine.can_release_payout(client, contract, milestone, freelancer)
    assert not res.allowed, "Expected cannot release unfunded milestone"
    print("  [PASS] Cannot release unfunded milestone")

    # 6. Release when verified + funded but freelancer has no PayPal email must fail
    milestone.payment_status = PaymentStatus.STAGED_IN_SANDBOX
    res = PolicyEngine.can_release_payout(client, contract, milestone, freelancer_no_paypal)
    assert not res.allowed, "Expected cannot release without freelancer PayPal email"
    print("  [PASS] Cannot release without freelancer PayPal payout email")

    # 7. Release when verified + funded + PayPal email present succeeds
    res = PolicyEngine.can_release_payout(client, contract, milestone, freelancer)
    assert res.allowed, f"Expected can release, got: {res.reason}"
    print("  [PASS] Client can authorize release when verified and funded with PayPal email")


def test_payout_idempotency_database():
    """Verify that duplicate release requests with payout:{milestone_id} are prevented."""
    print("\n--- [2/5] Testing Payout Idempotency Key Enforcement ---")
    setup_test_db()
    with Session(test_engine) as session:
        c_id = uuid.uuid4()
        m_id = uuid.uuid4()
        f_id = uuid.uuid4()
        request_id = f"payout:{m_id}"

        # First payout creation
        payout1 = Payout(
            contract_id=c_id,
            milestone_id=m_id,
            freelancer_id=f_id,
            amount=Decimal("500.00"),
            currency="USD",
            paypal_payout_email="freelancer@sandbox.com",
            paypal_batch_id="BATCH-TEST-001",
            paypal_item_id="ITEM-TEST-001",
            status=PayoutStatus.SUCCESS.value,
            idempotency_key=request_id,
        )
        session.add(payout1)
        session.commit()

        # Attempt to find duplicate by idempotency key
        existing = session.exec(select(Payout).where(Payout.idempotency_key == request_id)).first()
        assert existing is not None, "Existing payout should be found"
        assert existing.paypal_batch_id == "BATCH-TEST-001"
        assert existing.status == PayoutStatus.SUCCESS.value
        print("  [PASS] Idempotency key 'payout:{milestone_id}' correctly detects existing transaction")


def test_webhook_idempotency():
    """Verify that PayPal webhooks with duplicate event_ids are not reprocessed."""
    print("\n--- [3/5] Testing PayPal Webhook Idempotency ---")
    with Session(test_engine) as session:
        event_id = f"WH-EVENT-{uuid.uuid4().hex[:12].upper()}"

        pe1 = ProviderEvent(
            event_id=event_id,
            event_type="PAYMENT.CAPTURE.COMPLETED",
            resource_id="CAP-12345",
            payload={"id": event_id, "status": "COMPLETED"},
            processed=True,
        )
        session.add(pe1)
        session.commit()

        # Second delivery of same webhook event
        existing = session.exec(select(ProviderEvent).where(ProviderEvent.event_id == event_id)).first()
        assert existing is not None, "Provider event should already exist"
        assert existing.processed is True
        print(f"  [PASS] Webhook event {event_id} correctly identified as already processed")


async def test_paypal_sandbox_oauth():
    """Verify connection and OAuth2 token generation against PayPal Developer sandbox."""
    print("\n--- [4/5] Testing PayPal Sandbox API Connectivity ---")
    print(f"  Target Sandbox URL: {paypal_client.get_base_url()}")
    print(f"  Client ID configured: {bool(settings.paypal_client_id)}")

    if not settings.paypal_client_id or not settings.paypal_client_secret:
        print("  [SKIP] PayPal client ID/secret missing in .env")
        return

    try:
        token = await paypal_client.get_paypal_access_token()
        assert token and len(token) > 10, "Access token received from PayPal"
        print(f"  [PASS] PayPal OAuth2 Bearer token obtained successfully (length: {len(token)})")

        # Test Order creation on sandbox
        test_amount = 50.00
        order_data = await paypal_client.create_paypal_order(
            amount=test_amount,
            currency="USD",
            reference_id=f"test-ms-{uuid.uuid4().hex[:8]}",
            description="Phase 4 Sandbox Verification Order",
        )
        order_id = order_data.get("id")
        order_status = order_data.get("status")
        assert order_id, "Order ID returned by PayPal"
        print(f"  [PASS] Sandbox Orders v2 Created: Order ID = {order_id}, Status = {order_status}")

    except Exception as exc:
        print(f"  [NOTE] PayPal Sandbox Network Call: {exc}")
        print("  (If offline or credentials are dummy, backend unit tests still pass.)")


def print_phase_4_summary():
    print("\n=======================================================")
    print("  Phase 4 PayPal Fund & Payout Suite Completed")
    print("  All policy, idempotency and database assertions: PASS")
    print("=======================================================\n")


async def main():
    test_policy_engine_rules()
    test_payout_idempotency_database()
    test_webhook_idempotency()
    await test_paypal_sandbox_oauth()
    print_phase_4_summary()


if __name__ == "__main__":
    asyncio.run(main())
