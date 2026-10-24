import uuid
from typing import Any, Dict, Optional
from sqlmodel import Session, select
from app.models.audit import AuditEvent


def log_audit_event(
    session: Session,
    action: str,
    details: str,
    contract_id: Optional[uuid.UUID] = None,
    actor_id: Optional[uuid.UUID] = None,
    actor_name: str = "System",
    metadata: Optional[Dict[str, Any]] = None,
) -> AuditEvent:
    """Record an immutable, timestamped audit log event."""
    event = AuditEvent(
        contract_id=contract_id,
        actor_id=actor_id,
        actor_name=actor_name,
        action=action,
        details=details,
        metadata_json=metadata or {},
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


def get_contract_audit_logs(
    session: Session,
    contract_id: uuid.UUID,
) -> list[AuditEvent]:
    """Retrieve all chronological audit events for a given contract."""
    statement = (
        select(AuditEvent)
        .where(AuditEvent.contract_id == contract_id)
        .order_by(AuditEvent.created_at.desc())
    )
    return list(session.exec(statement).all())
