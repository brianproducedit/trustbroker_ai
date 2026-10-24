import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract
from app.models.audit import AuditEvent
from app.services.audit_service import get_contract_audit_logs
from app.utils.security import get_current_user, require_contract_party

router = APIRouter(prefix="/audit", tags=["Audit Log"])


@router.get("/{contract_id}", response_model=List[AuditEvent], summary="Get chronological audit trail for a contract")
def get_audit_trail(
    contract_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Retrieve immutable audit logs for a contract."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    require_contract_party(current_user, contract)
    return get_contract_audit_logs(session=session, contract_id=contract_id)
