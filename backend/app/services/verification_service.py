"""
Verification service facade forwarding to the multimodal verification orchestrator.
Preserves existing interface for routers and background tasks.
"""
import logging
import uuid
from typing import Any, Dict
from sqlmodel import Session
from app.models.user import UserProfile
from app.services.verification.orchestrator import run_verification_orchestration

logger = logging.getLogger("trustbroker.verification.background")


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


def run_verification_background(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    delivery_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Run AI verification in a FastAPI BackgroundTask with a fresh DB session.

    Keeps the submit HTTP request fast on Render's free tier: long-running
    Groq/vision calls execute after the response is sent. A fresh session is
    required because request-scoped sessions are closed once the response leaves.
    """
    from app.database import engine

    with Session(engine) as bg_session:
        actor = bg_session.get(UserProfile, user_id)
        if actor is None:
            logger.warning("Background verification skipped: user %s not found", user_id)
            return
        try:
            run_verification_orchestration(
                session=bg_session,
                contract_id=contract_id,
                milestone_id=milestone_id,
                delivery_id=delivery_id,
                actor=actor,
            )
        except Exception:
            logger.exception("Background verification failed for delivery %s", delivery_id)
