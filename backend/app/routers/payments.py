import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract
from app.models.payment import PaymentAttempt
from app.schemas.payment import (
    CreateOrderRequest,
    CaptureOrderRequest,
    ReleasePayoutRequest,
    PaymentAttemptRead,
    PayoutRead,
)
from app.services import payment_service
from app.utils.security import get_current_user, require_contract_party

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/create-order", summary="Create PayPal order to fund a milestone")
async def create_order(
    req: CreateOrderRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Generate a PayPal order so the client can fund a milestone."""
    return await payment_service.create_milestone_escrow_order(
        session=session,
        contract_id=req.contract_id,
        milestone_id=req.milestone_id,
        client=current_user,
    )


@router.post("/capture-order", response_model=PaymentAttemptRead, summary="Capture PayPal order for a funded milestone")
async def capture_order(
    req: CaptureOrderRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Capture payment after client approves PayPal popup modal."""
    return await payment_service.capture_milestone_escrow_payment(
        session=session,
        paypal_order_id=req.paypal_order_id,
        client=current_user,
    )


@router.post("/release", summary="Send a PayPal payout to the freelancer")
async def release_payout(
    req: ReleasePayoutRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """PayPal Payouts API after verification. Duplicate calls reuse PayPal-Request-Id payout:{milestone_id}."""
    return await payment_service.release_milestone_payout(
        session=session,
        contract_id=req.contract_id,
        milestone_id=req.milestone_id,
        client=current_user,
    )


@router.get("/earnings", response_model=List[PayoutRead], summary="Freelancer payout rows")
def list_earnings(
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """PayPal payout ledger for the signed-in freelancer."""
    return payment_service.list_my_payouts(session, current_user)


@router.get("/payouts/{contract_id}", response_model=List[PayoutRead], summary="Payouts for a contract")
def list_contract_payouts(
    contract_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return payment_service.list_contract_payouts(session, contract_id, current_user)


@router.get("/history/{contract_id}", response_model=List[PaymentAttemptRead], summary="Get payment attempts for a contract")
def get_payment_history(
    contract_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Retrieve all payment attempts and transactions associated with a contract."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_contract_party(current_user, contract)

    attempts = list(
        session.exec(
            select(PaymentAttempt)
            .where(PaymentAttempt.contract_id == contract_id)
            .order_by(PaymentAttempt.created_at.desc())
        ).all()
    )
    return [PaymentAttemptRead.model_validate(a) for a in attempts]


@router.post("/webhook", summary="Receive asynchronous PayPal webhook notifications")
async def paypal_webhook(
    request: Request,
    session: Session = Depends(get_session),
):
    """Receive, verify and idempotently process PayPal webhooks."""
    headers = dict(request.headers)
    payload = await request.json()
    return await payment_service.process_paypal_webhook(
        session=session,
        headers=headers,
        payload=payload,
    )

