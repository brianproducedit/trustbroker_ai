import json
from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select, func
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract, ContractStatus
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus
from app.models.marketplace import Application, Payout
from app.schemas.ai import (
    SOWDraftRequest,
    SOWDraftResponse,
    ClarifyRequest,
    ClarifyResponse,
    VetApplicationRequest,
    DeliveryVerificationRequest,
    StudioTurnRequest,
    StudioTurnResponse,
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
        "service": "Groq LPU (Primary) + OpenRouter (Secondary) + DeepSeek Official (Tier 3 Fallback)",
        "primary_model": ai_provider.settings.groq_model,
        "fallback_model": ai_provider.settings.openrouter_model,
        "deepseek_model": ai_provider.settings.deepseek_model,
        "groq_configured": bool(ai_provider.settings.groq_api_key),
        "openrouter_configured": bool(ai_provider.settings.openrouter_api_key),
        "deepseek_configured": bool(ai_provider.settings.deepseek_api_key),
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
    summary="AI-vet a freelancer application using profile, portfolio, cover and past work",
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


@router.post("/studio-turn", response_model=StudioTurnResponse, summary="AG Studio agent proxy — routes NL queries with live DB context")
def studio_turn(
    req: StudioTurnRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Receives a natural language message from the AG Studio agent framework,
    gathers live contract/milestone/payout stats from PostgreSQL, queries Groq/OpenRouter
    with live context and returns a structured response that updates the Studio dashboard.
    """
    # 1. Fetch live contextual metrics for this user and workspace
    live_context = {}
    if req.workspace == "client":
        contracts = list(session.exec(
            select(Contract).where(Contract.client_id == current_user.id)
        ).all())
        contract_ids = [c.id for c in contracts]
        milestones = []
        if contract_ids:
            milestones = list(session.exec(
                select(Milestone).where(Milestone.contract_id.in_(contract_ids))
            ).all())

        unpaid_funded = [
            m for m in milestones
            if m.payment_status == PaymentStatus.STAGED_IN_SANDBOX and m.status != MilestoneStatus.SETTLED
        ]
        released_payouts = [
            m for m in milestones
            if m.payment_status == PaymentStatus.RELEASED or m.status == MilestoneStatus.SETTLED
        ]
        open_contracts = [c for c in contracts if c.status == ContractStatus.OPEN]
        active_contracts = [c for c in contracts if c.status == ContractStatus.ACTIVE]

        live_context = {
            "total_contracts": len(contracts),
            "open_contracts_count": len(open_contracts),
            "active_contracts_count": len(active_contracts),
            "unpaid_funded_milestones_count": len(unpaid_funded),
            "unpaid_funded_milestones": [
                {
                    "title": m.title,
                    "amount": float(m.amount),
                    "status": m.status.value,
                    "payment_status": m.payment_status.value,
                }
                for m in unpaid_funded
            ],
            "total_staged_usd": float(sum(c.staged_amount for c in contracts)),
            "total_released_usd": float(sum(c.released_amount for c in contracts)),
        }
    else:
        # Freelancer workspace
        my_apps = list(session.exec(
            select(Application).where(Application.freelancer_id == current_user.id)
        ).all())
        awarded_apps = [a for a in my_apps if a.status == "awarded"]
        contracts = list(session.exec(
            select(Contract).where(
                (Contract.freelancer_id == current_user.id) |
                (Contract.freelancer_email == current_user.email)
            )
        ).all())
        contract_ids = [c.id for c in contracts]
        milestones = []
        if contract_ids:
            milestones = list(session.exec(
                select(Milestone).where(Milestone.contract_id.in_(contract_ids))
            ).all())

        payouts = list(session.exec(
            select(Payout).where(Payout.freelancer_id == current_user.id)
        ).all())
        total_earned = float(sum(p.amount for p in payouts if p.status == "completed"))
        if not total_earned:
            total_earned = float(sum(c.released_amount for c in contracts))

        live_context = {
            "total_applications": len(my_apps),
            "awarded_applications": len(awarded_apps),
            "win_rate_percent": round((len(awarded_apps) / len(my_apps) * 100) if my_apps else 0, 1),
            "active_contracts_count": len([c for c in contracts if c.status == ContractStatus.ACTIVE]),
            "upcoming_milestones": [
                {
                    "title": m.title,
                    "amount": float(m.amount),
                    "deadline": m.deadline,
                    "status": m.status.value,
                }
                for m in milestones
                if m.status in (MilestoneStatus.IN_PROGRESS, MilestoneStatus.PENDING)
            ],
            "total_earnings_usd": total_earned,
        }

    # 2. Build system and user prompt for Groq/OpenRouter
    system_prompt = (
        "You are TrustBroker AI Operations Copilot, an analytical assistant embedded in the "
        f"AG Studio operations dashboard for the {req.workspace} workspace.\n"
        "You have direct access to the live PostgreSQL database state for this user:\n"
        f"DATABASE CONTEXT: {json.dumps(live_context, default=str)}\n\n"
        "Instructions:\n"
        "1. Answer user questions directly, accurately and authoritatively based on the database context.\n"
        "2. If asked about unpaid funded milestones, earnings, win rates, or contract health, quote the exact figures.\n"
        "3. Provide 2-3 concise, actionable next steps or suggested actions.\n"
        "4. Format your response strictly as a JSON object with keys:\n"
        "   - 'response': string with clear markdown formatted explanation\n"
        "   - 'type': 'text' | 'chart' | 'table'\n"
        "   - 'suggested_actions': list of short action strings\n"
        "   - 'data_summary': object summarizing the referenced numbers\n"
    )

    user_prompt = f"User query: {req.message}\nActive workspace: {req.workspace}"

    # Call AI with fallbacks
    ai_result, provider_used = ai_provider.call_ai_with_fallbacks(system_prompt, user_prompt)

    if ai_result and isinstance(ai_result, dict) and "response" in ai_result:
        return StudioTurnResponse(
            response=str(ai_result.get("response", "")),
            workspace=req.workspace,
            type=str(ai_result.get("type", "text")),
            suggested_actions=ai_result.get("suggested_actions", []),
            data_summary=ai_result.get("data_summary", live_context),
        )

    # Deterministic fallback when AI is unavailable or rate limited
    msg_lower = req.message.lower()
    if req.workspace == "client":
        if "unpaid" in msg_lower or "funded" in msg_lower or "milestone" in msg_lower:
            count = live_context.get("unpaid_funded_milestones_count", 0)
            staged = live_context.get("total_staged_usd", 0.0)
            text = f"You currently have **{count} funded milestone(s)** staged via PayPal with **${staged:,.2f} USD** staged awaiting verified deliverable inspection."
            actions = ["View Milestone Inspection", "Check PayPal Ledger", "Review Deliveries"]
        elif "payout" in msg_lower or "released" in msg_lower or "spent" in msg_lower:
            released = live_context.get("total_released_usd", 0.0)
            text = f"You have authorized and released **${released:,.2f} USD** in PayPal payouts across all completed milestones."
            actions = ["Export Payment Receipt", "View Contract History"]
        else:
            text = f"Your client workspace has **{live_context.get('active_contracts_count', 0)} active contract(s)** and **{live_context.get('open_contracts_count', 0)} open listing(s)**. Total funds in staging: **${live_context.get('total_staged_usd', 0.0):,.2f} USD**."
            actions = ["Review Open Listings", "Check Milestone Deadlines"]
    else:
        # Freelancer fallback
        if "earn" in msg_lower or "month" in msg_lower or "payout" in msg_lower:
            earned = live_context.get("total_earnings_usd", 0.0)
            text = f"Your total recorded earnings across verified milestones are **${earned:,.2f} USD**, disbursed via the PayPal Payouts API."
            actions = ["View Payout History", "Check Sandbox Wallet"]
        elif "deadline" in msg_lower or "upcoming" in msg_lower:
            upcoming = len(live_context.get("upcoming_milestones", []))
            text = f"You have **{upcoming} upcoming milestone(s)** currently in progress or awaiting deliverable evidence submission."
            actions = ["Upload Deliverables", "View Active SOW"]
        else:
            win_rate = live_context.get("win_rate_percent", 0.0)
            text = f"You have submitted **{live_context.get('total_applications', 0)} application(s)** with an award win rate of **{win_rate}%**. Total earnings: **${live_context.get('total_earnings_usd', 0.0):,.2f} USD**."
            actions = ["Browse Marketplace", "Update Portfolio"]

    return StudioTurnResponse(
        response=text,
        workspace=req.workspace,
        type="text",
        suggested_actions=actions,
        data_summary=live_context,
    )
