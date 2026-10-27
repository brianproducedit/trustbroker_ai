"""
Verification service facade forwarding to the multimodal verification orchestrator.
Preserves existing interface for routers and background tasks.
"""
import uuid
from typing import Any, Dict
from sqlmodel import Session
from app.models.user import UserProfile
from app.services.verification.orchestrator import run_verification_orchestration


def orchestrate_delivery_verification(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    delivery_id: uuid.UUID,
    actor: UserProfile,
) -> Dict[str, Any]:
    """Execute Multimodal AI verification for a delivery submission against its milestone acceptance criteria."""
    return run_verification_orchestration(
        session=session,
        contract_id=contract_id,
        milestone_id=milestone_id,
        delivery_id=delivery_id,
        actor=actor,
    )
