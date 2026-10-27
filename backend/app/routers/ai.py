from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.database import get_session
from app.models.user import UserProfile
from app.schemas.ai import (
    SOWDraftRequest,
    SOWDraftResponse,
    ClarifyRequest,
    ClarifyResponse,
    VetApplicationRequest,
    DeliveryVerificationRequest,
)
from app.schemas.marketplace import ApplicationRead
from app.services import marketplace_service
from app.services import ai_provider, verification_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Verification & Drafting"])


@router.get("/status", summary="AI service health & configuration status")
def ai_status():
    """Return model status and readiness."""
    return {
        "service": "Groq LPU (Primary) + OpenRouter (Fallback)",
        "primary_model": ai_provider.settings.groq_model,
        "fallback_model": ai_provider.settings.openrouter_model,
        "groq_configured": bool(ai_provider.settings.groq_api_key),
        "openrouter_configured": bool(ai_provider.settings.openrouter_api_key),
        "status": "ready",
    }


@router.post("/draft-sow", response_model=SOWDraftResponse, summary="Generate structured Statement of Work from project prompt")
def draft_sow(
    req: SOWDraftRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    """Call AI (Groq LPU with OpenRouter fallback) to decompose natural language brief into milestones & criteria."""
    result = ai_provider.generate_sow_draft(
        project_prompt=req.prompt,
        category=req.category,
        total_budget=req.total_budget,
        currency=req.currency,
    )
    return result


@router.post(
    "/clarify",
    response_model=ClarifyResponse,
    summary="Ask the client clarifying questions before publishing a contract",
)
def clarify_brief(
    req: ClarifyRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    """Return 3–6 short questions so the client can refine the SOW. Skip is allowed in the UI."""
    _ = current_user
    result = ai_provider.generate_clarify_questions(
        project_prompt=req.prompt,
        category=req.category,
        total_budget=req.total_budget,
        answers=req.answers,
    )
    return result


@router.post(
    "/vet-application",
    response_model=ApplicationRead,
    summary="AI-vet a freelancer application using profile, portfolio, cover, and past work",
)
def vet_application_endpoint(
    req: VetApplicationRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Writes vetting_reports. Newcomers are not scored 0 on empty job history."""
    return marketplace_service.rerun_vetting(session, req.application_id, current_user)


@router.post("/verify-delivery", summary="Run AI verification against submitted milestone evidence")
def verify_delivery(
    req: DeliveryVerificationRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Verify submitted deliverable evidence against acceptance criteria using Groq LPU with OpenRouter fallback."""
    return verification_service.orchestrate_delivery_verification(
        session=session,
        contract_id=req.contract_id,
        milestone_id=req.milestone_id,
        delivery_id=req.delivery_id,
        actor=current_user,
    )
