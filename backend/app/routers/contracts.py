import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlmodel import Session
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract
from app.schemas.contract import (
    ContractCreateRequest,
    ContractUpdateRequest,
    ContractRead,
    ContractListResponse,
)
from app.schemas.marketplace import (
    ApplicationCreateRequest,
    ApplicationListResponse,
    ApplicationRead,
)
from app.services import contract_service, marketplace_service
from app.utils.security import (
    get_current_user,
    require_contract_party,
)

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.post("", response_model=ContractRead, status_code=status.HTTP_201_CREATED, summary="Create a new contract draft as a client")
def create_contract(
    req: ContractCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Client creates a private contract draft with milestones and acceptance criteria."""
    return contract_service.create_contract(session=session, client=current_user, req=req)


@router.get("", response_model=ContractListResponse, summary="List contracts for authenticated user")
def list_contracts(
    role: Optional[str] = Query(None, description="Filter by role: 'client' or 'freelancer'"),
    status: Optional[str] = Query(None, description="Filter by status: e.g. 'draft', 'active', etc."),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Retrieve all contracts the client or freelancer is a party to, with optional role/status filters."""
    contracts, total = contract_service.list_user_contracts(
        session=session,
        user=current_user,
        role=role,
        status_filter=status,
        page=page,
        per_page=per_page,
    )
    return ContractListResponse(contracts=contracts, total=total)


@router.get("/{contract_id}", response_model=ContractRead, summary="Get full contract details")
def get_contract(
    contract_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get full details of a specific contract including milestones and acceptance criteria."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_contract_party(current_user, contract)
    return contract_service.get_contract_full(session=session, contract_id=contract_id)


@router.put("/{contract_id}", response_model=ContractRead, summary="Update contract draft")
def update_contract(
    contract_id: uuid.UUID,
    req: ContractUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update contract draft details or milestones, incrementing the version number."""
    return contract_service.update_contract(
        session=session,
        contract_id=contract_id,
        client=current_user,
        req=req,
    )


@router.post("/{contract_id}/publish", response_model=ContractRead, summary="Publish a draft as an open contract")
def publish_contract(
    contract_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Client publishes a complete SOW so freelancers can apply. Requires title, milestones, amounts and criteria."""
    return marketplace_service.publish_contract(
        session=session,
        contract_id=contract_id,
        client=current_user,
    )


@router.post(
    "/{contract_id}/applications",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Freelancer applies to an open contract",
)
def apply_to_contract(
    contract_id: uuid.UUID,
    req: ApplicationCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Freelancer submits one application per open contract. A second apply returns 409."""
    return marketplace_service.apply_to_contract(
        session=session,
        contract_id=contract_id,
        freelancer=current_user,
        req=req,
    )


@router.get(
    "/{contract_id}/applications",
    response_model=ApplicationListResponse,
    summary="List applications (client only)",
)
def list_contract_applications(
    contract_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Only the client who published the contract can read applications and stub vetting scores."""
    applications, total = marketplace_service.list_contract_applications(
        session=session,
        contract_id=contract_id,
        client=current_user,
    )
    return ApplicationListResponse(applications=applications, total=total)


@router.post("/{contract_id}/accept", response_model=ContractRead, summary="Accept awarded or invited contract terms")
def accept_contract(
    contract_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Freelancer (or client) accepts the current version. When both parties accept, the contract becomes ACTIVE."""
    return contract_service.accept_contract(
        session=session,
        contract_id=contract_id,
        user=current_user,
    )


@router.post("/{contract_id}/cancel", response_model=ContractRead, summary="Cancel a contract")
def cancel_contract(
    contract_id: uuid.UUID,
    reason: Optional[str] = Query(None, description="Optional cancellation reason"),
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Cancel a contract draft or active contract."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_contract_party(current_user, contract)
    return contract_service.cancel_contract(
        session=session,
        contract_id=contract_id,
        user=current_user,
        reason=reason,
    )

