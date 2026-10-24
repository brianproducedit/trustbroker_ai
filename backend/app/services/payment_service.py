import uuid
from decimal import Decimal
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.contract import Contract
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus
from app.models.payment import PaymentAttempt, ProviderEvent
from app.models.user import UserProfile
from app.schemas.payment import PaymentAttemptRead
from app.services.audit_service import log_audit_event
from app.utils import paypal_client
from app.utils.security import require_client


async def create_milestone_escrow_order(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: Optional[uuid.UUID],
    client: UserProfile,
) -> Dict[str, Any]:
    """Create a PayPal checkout order to stage funds in escrow sandbox."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_client(client, contract)

    amount: Decimal = Decimal("0.00")
    description: str = f"TrustBroker Staging — Contract {contract.code}"

    target_milestone: Optional[Milestone] = None
    if milestone_id:
        target_milestone = session.get(Milestone, milestone_id)
        if not target_milestone or target_milestone.contract_id != contract.id:
            raise HTTPException(status_code=404, detail="Milestone not found for this contract")
        amount = target_milestone.amount
        description = f"Escrow Staging for Milestone: {target_milestone.title} ({contract.code})"
    else:
        amount = contract.total_amount
        description = f"Full Escrow Staging for Contract: {contract.title} ({contract.code})"

    if amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Cannot stage escrow for 0 or negative amount")

    # Call PayPal sandbox API
    order_data = await paypal_client.create_paypal_order(
        amount=float(amount),
        currency=contract.currency,
        reference_id=str(milestone_id or contract.id),
        description=description,
    )

    order_id = order_data["id"]

    # Record PaymentAttempt
    attempt = PaymentAttempt(
        contract_id=contract.id,
        milestone_id=milestone_id,
        paypal_order_id=order_id,
        amount=amount,
        currency=contract.currency,
        status=PaymentStatus.CHECKOUT_CREATED,
        paypal_status=order_data.get("status"),
    )
    session.add(attempt)

    if target_milestone:
        target_milestone.payment_status = PaymentStatus.CHECKOUT_CREATED
        session.add(target_milestone)

    session.commit()
    session.refresh(attempt)

    log_audit_event(
        session=session,
        action="payment_order_created",
        details=f"PayPal checkout order {order_id} created for amount {amount} {contract.currency}.",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"order_id": order_id, "amount": str(amount)},
    )

    return {
        "order_id": order_id,
        "paypal_order": order_data,
        "payment_attempt_id": str(attempt.id),
    }


async def capture_milestone_escrow_payment(
    session: Session,
    paypal_order_id: str,
    client: UserProfile,
) -> PaymentAttemptRead:
    """Capture PayPal order and transition milestone to staged_in_sandbox."""
    attempt = session.exec(
        select(PaymentAttempt).where(PaymentAttempt.paypal_order_id == paypal_order_id)
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Payment attempt not found for this order ID")

    contract = session.get(Contract, attempt.contract_id)
    require_client(client, contract)

    # Capture through PayPal API
    capture_data = await paypal_client.capture_paypal_order(paypal_order_id)
    capture_status = capture_data.get("status", "COMPLETED")

    capture_id = None
    payer_email = None

    try:
        purchase_units = capture_data.get("purchase_units", [])
        if purchase_units:
            captures = purchase_units[0].get("payments", {}).get("captures", [])
            if captures:
                capture_id = captures[0].get("id")
        payer_email = capture_data.get("payer", {}).get("email_address")
    except Exception:
        pass

    # Update attempt
    attempt.status = PaymentStatus.STAGED_IN_SANDBOX
    attempt.paypal_status = capture_status
    attempt.paypal_capture_id = capture_id or paypal_order_id
    attempt.payer_email = payer_email
    session.add(attempt)

    # Update milestone and contract staged amounts
    if attempt.milestone_id:
        milestone = session.get(Milestone, attempt.milestone_id)
        if milestone:
            milestone.payment_status = PaymentStatus.STAGED_IN_SANDBOX
            session.add(milestone)

    contract.staged_amount += attempt.amount
    session.add(contract)

    session.commit()
    session.refresh(attempt)

    log_audit_event(
        session=session,
        action="payment_staged_in_sandbox",
        details=f"Payment of {attempt.amount} {attempt.currency} captured and staged in PayPal sandbox escrow.",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={
            "paypal_order_id": paypal_order_id,
            "paypal_capture_id": attempt.paypal_capture_id,
            "amount": str(attempt.amount),
        },
    )

    return PaymentAttemptRead.model_validate(attempt)


def release_milestone_payout(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    client: UserProfile,
) -> Dict[str, Any]:
    """Release staged escrow funds to supplier after work verification."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_client(client, contract)

    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="Milestone not found for this contract")

    # Deterministic Policy Check
    if milestone.status != MilestoneStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Milestone cannot be released: current status is '{milestone.status.value}', must be 'verified'.",
        )

    # Transition milestone
    milestone.payment_status = PaymentStatus.RELEASED
    milestone.status = MilestoneStatus.SETTLED
    session.add(milestone)

    # Update contract balances
    if contract.staged_amount >= milestone.amount:
        contract.staged_amount -= milestone.amount
    else:
        contract.staged_amount = Decimal("0.00")
    contract.released_amount += milestone.amount
    session.add(contract)

    # Check if all milestones completed
    all_milestones = list(
        session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all()
    )
    if all(m.status == MilestoneStatus.SETTLED for m in all_milestones):
        contract.status = ContractStatus.COMPLETED

    session.commit()

    log_audit_event(
        session=session,
        action="milestone_payout_released",
        details=f"Escrow release authorized for milestone '{milestone.title}'. Amount: {milestone.amount} {contract.currency}.",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"milestone_id": str(milestone.id), "released_amount": str(milestone.amount)},
    )

    return {
        "status": "released",
        "milestone_id": str(milestone.id),
        "released_amount": str(milestone.amount),
        "milestone_status": milestone.status.value,
        "contract_staged_amount": str(contract.staged_amount),
        "contract_released_amount": str(contract.released_amount),
    }
