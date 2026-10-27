import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from app.models.contract import Contract, ContractStatus
from app.models.marketplace import Payout, PayoutStatus
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus
from app.models.payment import PaymentAttempt, ProviderEvent
from app.models.user import UserProfile
from app.schemas.payment import PaymentAttemptRead, PayoutRead
from app.services.audit_service import log_audit_event
from app.services.notification_service import queue_notification
from app.services.policy_engine import PolicyEngine
from app.utils import paypal_client
from app.utils.security import require_client, require_contract_party


def _next_unfunded_milestone(session: Session, contract_id: uuid.UUID) -> Optional[Milestone]:
    rows = list(
        session.exec(
            select(Milestone)
            .where(Milestone.contract_id == contract_id)
            .order_by(Milestone.sort_order.asc(), Milestone.created_at.asc())
        ).all()
    )
    funded = {
        PaymentStatus.STAGED_IN_SANDBOX,
        PaymentStatus.RELEASE_AUTHORIZED,
        PaymentStatus.RELEASED,
    }
    for row in rows:
        if row.payment_status not in funded:
            return row
    return None


def _mark_milestone_funded(session: Session, attempt: PaymentAttempt) -> None:
    if attempt.status == PaymentStatus.STAGED_IN_SANDBOX:
        return
    attempt.status = PaymentStatus.STAGED_IN_SANDBOX
    session.add(attempt)
    contract = session.get(Contract, attempt.contract_id)
    if attempt.milestone_id:
        milestone = session.get(Milestone, attempt.milestone_id)
        if milestone and milestone.payment_status not in (
            PaymentStatus.STAGED_IN_SANDBOX,
            PaymentStatus.RELEASE_AUTHORIZED,
            PaymentStatus.RELEASED,
        ):
            milestone.payment_status = PaymentStatus.STAGED_IN_SANDBOX
            if milestone.status == MilestoneStatus.PENDING:
                milestone.status = MilestoneStatus.IN_PROGRESS
            session.add(milestone)
            if contract:
                contract.staged_amount += attempt.amount
                session.add(contract)
    if contract and contract.freelancer_id:
        queue_notification(
            session,
            user_id=contract.freelancer_id,
            type="milestone_funded",
            title="Milestone funded",
            body=f"{contract.code} has a funded milestone. You can start delivery.",
            entity_type="contract",
            entity_id=contract.id,
        )


def _apply_payout_status(session: Session, payout: Payout, status_value: str) -> None:
    mapped = status_value.lower()
    aliases = {
        "success": PayoutStatus.SUCCESS.value,
        "succeeded": PayoutStatus.SUCCESS.value,
        "pending": PayoutStatus.PROCESSING.value,
        "processing": PayoutStatus.PROCESSING.value,
        "unclaimed": PayoutStatus.UNCLAIMED.value,
        "failed": PayoutStatus.FAILED.value,
        "denied": PayoutStatus.FAILED.value,
        "returned": PayoutStatus.RETURNED.value,
        "canceled": PayoutStatus.FAILED.value,
        "cancelled": PayoutStatus.FAILED.value,
    }
    payout.status = aliases.get(mapped, mapped)
    payout.updated_at = datetime.now(timezone.utc)
    session.add(payout)
    if payout.status == PayoutStatus.SUCCESS.value:
        milestone = session.get(Milestone, payout.milestone_id)
        contract = session.get(Contract, payout.contract_id)
        if milestone and milestone.payment_status != PaymentStatus.RELEASED:
            milestone.payment_status = PaymentStatus.RELEASED
            milestone.status = MilestoneStatus.SETTLED
            session.add(milestone)
            if contract:
                if contract.staged_amount >= milestone.amount:
                    contract.staged_amount -= milestone.amount
                else:
                    contract.staged_amount = Decimal("0.00")
                contract.released_amount += milestone.amount
                all_milestones = list(
                    session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all()
                )
                if all(m.status == MilestoneStatus.SETTLED for m in all_milestones):
                    contract.status = ContractStatus.COMPLETED
                session.add(contract)


async def create_milestone_escrow_order(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: Optional[uuid.UUID],
    client: UserProfile,
) -> Dict[str, Any]:
    """Create a PayPal checkout order so the client can fund the next milestone."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_client(client, contract)

    if not milestone_id:
        raise HTTPException(status_code=400, detail="A milestone_id is required to fund a milestone.")

    target_milestone = session.get(Milestone, milestone_id)
    if not target_milestone or target_milestone.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="Milestone not found for this contract")

    next_open = _next_unfunded_milestone(session, contract.id)
    if not next_open or next_open.id != target_milestone.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the next unfunded milestone can be funded.",
        )

    fund_policy = PolicyEngine.can_fund(client, contract, target_milestone)
    if not fund_policy.allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=fund_policy.reason)

    amount = target_milestone.amount
    if amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Cannot fund a milestone with a zero or negative amount")

    description = f"Fund milestone: {target_milestone.title} ({contract.code})"
    try:
        order_data = await paypal_client.create_paypal_order(
            amount=float(amount),
            currency=contract.currency,
            reference_id=str(milestone_id),
            description=description,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"PayPal order creation failed: {exc}") from exc

    order_id = order_data["id"]
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
    target_milestone.payment_status = PaymentStatus.CHECKOUT_CREATED
    session.add(target_milestone)
    session.commit()
    session.refresh(attempt)

    log_audit_event(
        session=session,
        action="payment_order_created",
        details=f"PayPal checkout order {order_id} created to fund {amount} {contract.currency}.",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"order_id": order_id, "amount": str(amount), "milestone_id": str(milestone_id)},
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
    """Capture a PayPal order. Milestone is funded only when PayPal reports COMPLETED."""
    attempt = session.exec(
        select(PaymentAttempt).where(PaymentAttempt.paypal_order_id == paypal_order_id)
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Payment attempt not found for this order ID")

    contract = session.get(Contract, attempt.contract_id)
    require_client(client, contract)

    try:
        capture_data = await paypal_client.capture_paypal_order(paypal_order_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"PayPal capture failed: {exc}") from exc

    capture_status = str(capture_data.get("status") or "")
    capture_id = None
    payer_email = None
    purchase_units = capture_data.get("purchase_units") or []
    if purchase_units:
        captures = (purchase_units[0].get("payments") or {}).get("captures") or []
        if captures:
            capture_id = captures[0].get("id")
            capture_status = str(captures[0].get("status") or capture_status)
    payer_email = (capture_data.get("payer") or {}).get("email_address")

    attempt.paypal_status = capture_status
    attempt.paypal_capture_id = capture_id or attempt.paypal_capture_id
    attempt.payer_email = payer_email
    session.add(attempt)

    if capture_status.upper() != "COMPLETED":
        session.commit()
        session.refresh(attempt)
        log_audit_event(
            session=session,
            action="payment_capture_incomplete",
            details=f"PayPal capture for order {paypal_order_id} is {capture_status}; milestone not funded.",
            contract_id=contract.id,
            actor_id=client.id,
            actor_name=client.full_name or client.email,
            metadata={"paypal_order_id": paypal_order_id, "paypal_status": capture_status},
        )
        raise HTTPException(
            status_code=409,
            detail=f"PayPal capture is {capture_status}, not COMPLETED. The milestone is not funded.",
        )

    _mark_milestone_funded(session, attempt)
    session.commit()
    session.refresh(attempt)

    log_audit_event(
        session=session,
        action="payment_capture_completed",
        details=f"Payment of {attempt.amount} {attempt.currency} captured. Milestone funded.",
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


async def release_milestone_payout(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    client: UserProfile,
) -> Dict[str, Any]:
    """Send a PayPal payout after verification. Idempotent via PayPal-Request-Id = payout:{milestone_id}."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_client(client, contract)

    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="Milestone not found for this contract")

    freelancer = session.get(UserProfile, contract.freelancer_id) if contract.freelancer_id else None
    release_policy = PolicyEngine.can_release_payout(client, contract, milestone, freelancer)
    if not release_policy.allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=release_policy.reason)

    receiver = (freelancer.paypal_payout_email or "").strip() if freelancer else ""
    if not receiver:
        raise HTTPException(status_code=400, detail="Freelancer PayPal payout email is required before release.")

    request_id = f"payout:{milestone.id}"
    existing = session.exec(select(Payout).where(Payout.idempotency_key == request_id)).first()
    if existing and existing.status in (
        PayoutStatus.SUCCESS.value,
        PayoutStatus.PROCESSING.value,
        PayoutStatus.UNCLAIMED.value,
    ):
        return {
            "status": existing.status,
            "payout": PayoutRead.model_validate(existing).model_dump(mode="json"),
            "duplicate": True,
        }

    payout = existing or Payout(
        contract_id=contract.id,
        milestone_id=milestone.id,
        freelancer_id=freelancer.id,
        amount=milestone.amount,
        currency=contract.currency,
        paypal_payout_email=receiver,
        status=PayoutStatus.PENDING.value,
        idempotency_key=request_id,
    )
    if not existing:
        session.add(payout)
        try:
            session.flush()
        except IntegrityError:
            session.rollback()
            existing = session.exec(select(Payout).where(Payout.idempotency_key == request_id)).first()
            if existing:
                return {
                    "status": existing.status,
                    "payout": PayoutRead.model_validate(existing).model_dump(mode="json"),
                    "duplicate": True,
                }
            raise

    try:
        payout_data = await paypal_client.create_payout(
            amount=float(milestone.amount),
            currency=contract.currency,
            receiver_email=receiver,
            request_id=request_id,
            note=f"TrustBroker payout for {contract.code} — {milestone.title}",
        )
    except Exception as exc:
        payout.status = PayoutStatus.FAILED.value
        payout.updated_at = datetime.now(timezone.utc)
        session.add(payout)
        session.commit()
        raise HTTPException(status_code=502, detail=f"PayPal payout failed: {exc}") from exc

    header = payout_data.get("batch_header") or {}
    payout.paypal_batch_id = header.get("payout_batch_id") or payout.paypal_batch_id
    items = payout_data.get("items") or []
    if items:
        payout.paypal_item_id = items[0].get("payout_item_id") or payout.paypal_item_id
        item_status = (items[0].get("transaction_status") or header.get("batch_status") or "PENDING")
    else:
        item_status = header.get("batch_status") or "PENDING"

    milestone.payment_status = PaymentStatus.RELEASE_AUTHORIZED
    session.add(milestone)
    _apply_payout_status(session, payout, item_status)
    session.commit()
    session.refresh(payout)

    log_audit_event(
        session=session,
        action="payout_batch_created",
        details=f"PayPal payout {payout.paypal_batch_id or request_id} created for {milestone.amount} {contract.currency}.",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={
            "milestone_id": str(milestone.id),
            "paypal_batch_id": payout.paypal_batch_id,
            "paypal_item_id": payout.paypal_item_id,
            "payout_status": payout.status,
        },
    )
    if freelancer:
        queue_notification(
            session,
            user_id=freelancer.id,
            type="payout_sent",
            title="PayPal payout sent",
            body=f"{milestone.amount} {contract.currency} was sent to {receiver} for {contract.code}.",
            entity_type="payout",
            entity_id=payout.id,
        )
        session.commit()

    return {
        "status": payout.status,
        "milestone_id": str(milestone.id),
        "released_amount": str(milestone.amount),
        "paypal_batch_id": payout.paypal_batch_id,
        "paypal_item_id": payout.paypal_item_id,
        "payout": PayoutRead.model_validate(payout).model_dump(mode="json"),
        "duplicate": False,
    }


def list_contract_payouts(session: Session, contract_id: uuid.UUID, user: UserProfile) -> List[PayoutRead]:
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_contract_party(user, contract)
    rows = list(
        session.exec(
            select(Payout).where(Payout.contract_id == contract_id).order_by(Payout.created_at.desc())
        ).all()
    )
    return [PayoutRead.model_validate(p) for p in rows]


def list_my_payouts(session: Session, freelancer: UserProfile) -> List[PayoutRead]:
    rows = list(
        session.exec(
            select(Payout)
            .where(Payout.freelancer_id == freelancer.id)
            .order_by(Payout.created_at.desc())
        ).all()
    )
    return [PayoutRead.model_validate(p) for p in rows]


async def process_paypal_webhook(
    session: Session,
    headers: Dict[str, str],
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    """Process incoming PayPal webhooks idempotently with signature verification."""
    is_valid = await paypal_client.verify_webhook_signature(headers, payload)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PayPal webhook signature",
        )

    event_id = payload.get("id")
    event_type = payload.get("event_type", "UNKNOWN")
    resource = payload.get("resource") or {}
    resource_id = resource.get("id")

    if not event_id:
        raise HTTPException(status_code=400, detail="Missing webhook event ID")

    existing = session.exec(select(ProviderEvent).where(ProviderEvent.event_id == event_id)).first()
    if existing:
        return {"status": "already_processed", "event_id": event_id}

    provider_event = ProviderEvent(
        event_id=event_id,
        event_type=event_type,
        resource_id=resource_id,
        payload=payload,
        processed=False,
    )
    try:
        session.add(provider_event)
        session.flush()
    except IntegrityError:
        session.rollback()
        return {"status": "already_processed", "event_id": event_id}

    if event_type in ("PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.COMPLETED"):
        order_id = (
            (resource.get("supplementary_data") or {}).get("related_ids") or {}
        ).get("order_id") or resource_id
        attempt = session.exec(
            select(PaymentAttempt).where(
                (PaymentAttempt.paypal_capture_id == resource_id) | (PaymentAttempt.paypal_order_id == order_id)
            )
        ).first()
        if attempt:
            attempt.paypal_capture_id = attempt.paypal_capture_id or resource_id
            attempt.paypal_status = "COMPLETED"
            _mark_milestone_funded(session, attempt)
            log_audit_event(
                session=session,
                action="payment_capture_completed",
                details=f"Webhook captured PayPal payment {resource_id}.",
                contract_id=attempt.contract_id,
                metadata={"paypal_order_id": attempt.paypal_order_id, "paypal_capture_id": attempt.paypal_capture_id},
            )
    elif event_type in ("PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REFUNDED", "CHECKOUT.ORDER.VOIDED"):
        attempt = session.exec(
            select(PaymentAttempt).where(
                (PaymentAttempt.paypal_capture_id == resource_id) | (PaymentAttempt.paypal_order_id == resource_id)
            )
        ).first()
        if attempt:
            attempt.status = PaymentStatus.CANCELLED
            attempt.paypal_status = event_type
            session.add(attempt)
            if attempt.milestone_id:
                milestone = session.get(Milestone, attempt.milestone_id)
                if milestone and milestone.payment_status == PaymentStatus.CHECKOUT_CREATED:
                    milestone.payment_status = PaymentStatus.CANCELLED
                    session.add(milestone)
    elif event_type.startswith("PAYMENT.PAYOUTS"):
        batch_id = resource.get("batch_header", {}).get("payout_batch_id") or resource.get("payout_batch_id")
        item_id = resource.get("payout_item_id") or resource.get("payout_item", {}).get("payout_item_id")
        payout = None
        if item_id:
            payout = session.exec(select(Payout).where(Payout.paypal_item_id == item_id)).first()
        if not payout and batch_id:
            payout = session.exec(select(Payout).where(Payout.paypal_batch_id == batch_id)).first()
        sender_item = (resource.get("payout_item") or {}).get("sender_item_id")
        if not payout and sender_item:
            payout = session.exec(select(Payout).where(Payout.idempotency_key == sender_item)).first()
        if payout:
            if item_id:
                payout.paypal_item_id = payout.paypal_item_id or item_id
            tx_status = (
                resource.get("transaction_status")
                or (resource.get("batch_header") or {}).get("batch_status")
                or event_type.split(".")[-1]
            )
            _apply_payout_status(session, payout, tx_status)
            action = (
                "payout_item_succeeded"
                if payout.status == PayoutStatus.SUCCESS.value
                else "payout_item_updated"
            )
            log_audit_event(
                session=session,
                action=action,
                details=f"PayPal payout {payout.paypal_batch_id or payout.idempotency_key} is {payout.status}.",
                contract_id=payout.contract_id,
                metadata={
                    "paypal_batch_id": payout.paypal_batch_id,
                    "paypal_item_id": payout.paypal_item_id,
                    "payout_status": payout.status,
                },
            )

    provider_event.processed = True
    provider_event.processed_at = datetime.now(timezone.utc)
    session.add(provider_event)
    session.commit()
    return {"status": "processed", "event_id": event_id, "event_type": event_type}
