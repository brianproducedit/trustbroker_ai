import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract
from app.models.delivery import Delivery
from app.schemas.delivery import DeliveryCreateRequest, DeliveryRead, RevisionRequest
from app.services import delivery_service
from app.utils.security import get_current_user, require_contract_party

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit milestone deliverables")
def submit_milestone_delivery(
    req: DeliveryCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Freelancer submits work evidence (repo link, live URL, description, uploaded files) for a milestone."""
    return delivery_service.submit_delivery(
        session=session,
        freelancer=current_user,
        req=req,
    )


@router.get("/{delivery_id}", response_model=DeliveryRead, summary="Get delivery submission details")
def get_delivery(
    delivery_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Retrieve full details for a delivery submission."""
    delivery = session.get(Delivery, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    contract = session.get(Contract, delivery.contract_id)
    require_contract_party(current_user, contract)
    return delivery_service.get_delivery_full(session=session, delivery_id=delivery_id)


@router.get("/milestone/{milestone_id}", response_model=List[DeliveryRead], summary="List deliveries for a milestone")
def list_milestone_deliveries(
    milestone_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all delivery versions submitted for a milestone."""
    return delivery_service.list_milestone_deliveries(
        session=session,
        milestone_id=milestone_id,
        user=current_user,
    )


@router.post("/{contract_id}/{milestone_id}/request-revision", summary="Client requests revision on milestone delivery")
def request_milestone_revision(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    req: RevisionRequest = RevisionRequest(),
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Client rejects current delivery evidence and requests changes with notes."""
    return delivery_service.request_revision(
        session=session,
        contract_id=contract_id,
        milestone_id=milestone_id,
        client=current_user,
        notes=req.notes,
    )

