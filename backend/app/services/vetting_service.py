"""Applicant vetting with newcomer-safe scoring (roadmap §7.2)."""
from typing import Any, Dict, List, Optional
from sqlmodel import Session, select, func, col
from app.models.contract import Contract, ContractStatus
from app.models.marketplace import Application, VettingRecommendation, VettingReport
from app.models.user import UserProfile
from app.services.ai_provider import call_ai_with_fallbacks


def count_past_contracts(session: Session, freelancer_id) -> int:
    stmt = select(func.count(Contract.id)).where(
        Contract.freelancer_id == freelancer_id,
        col(Contract.status).in_(
            [ContractStatus.ACTIVE, ContractStatus.COMPLETED, ContractStatus.IN_VERIFICATION]
        ),
    )
    return int(session.exec(stmt).one() or 0)


def _cover_communication_score(cover: str) -> int:
    text = (cover or "").strip()
    if len(text) >= 180:
        return 82
    if len(text) >= 80:
        return 68
    if len(text) >= 20:
        return 52
    return 40


def _skills_match_score(freelancer: UserProfile, contract: Contract) -> int:
    required = [s.lower() for s in (contract.required_skills or []) if s]
    have = [s.lower() for s in (freelancer.skills or []) if s]
    if not required:
        return 70 if have else 55
    if not have:
        return 45
    hits = sum(1 for s in required if any(s in h or h in s for h in have))
    return min(95, 50 + int(45 * hits / max(1, len(required))))


def _portfolio_score(freelancer: UserProfile, snapshot: Optional[List[Dict[str, Any]]]) -> int:
    items = snapshot if snapshot is not None else (freelancer.portfolio or [])
    if not items:
        return 35
    with_url = sum(1 for p in items if (p.get("url") or p.get("title")))
    return min(95, 55 + with_url * 12)


def _deterministic_vet(
    freelancer: UserProfile,
    contract: Contract,
    cover: str,
    past_count: int,
    snapshot: Optional[List[Dict[str, Any]]],
) -> Dict[str, Any]:
    completeness = freelancer.profile_completeness or 0
    skills = _skills_match_score(freelancer, contract)
    portfolio = _portfolio_score(freelancer, snapshot)
    communication = _cover_communication_score(cover)
    newcomer = past_count == 0

    if newcomer:
        overall = int(round(0.40 * skills + 0.45 * portfolio + 0.15 * communication))
        past_delivery: Any = "insufficient_evidence"
    else:
        past_delivery = min(90, 50 + past_count * 12)
        overall = int(round(0.30 * skills + 0.25 * portfolio + 0.25 * past_delivery + 0.20 * communication))

    overall = max(25, min(100, overall))

    if completeness < 40:
        recommendation = VettingRecommendation.INSUFFICIENT_EVIDENCE.value
        rationale = "Profile completeness is under 40%. Ask the freelancer to finish bio, skills and portfolio before awarding."
        overall = min(overall, 48)
    elif newcomer and portfolio >= 70:
        recommendation = VettingRecommendation.NEW_TALENT.value
        rationale = "New talent · high portfolio match. No completed TrustBroker jobs — do not treat that as a zero score."
    elif overall >= 80:
        recommendation = VettingRecommendation.STRONG_FIT.value
        rationale = "Strong skills and evidence match for this listing."
    elif overall >= 62:
        recommendation = VettingRecommendation.POSSIBLE_FIT.value
        rationale = "Possible fit. Review the cover note and portfolio before awarding."
    else:
        recommendation = VettingRecommendation.WEAK_FIT.value
        rationale = "Limited match on skills or portfolio for this brief."

    trial = None
    if newcomer and recommendation == VettingRecommendation.NEW_TALENT.value:
        total = float(contract.total_amount or 0)
        suggested = max(50.0, min(400.0, round(total * 0.2, 2))) if total else 250.0
        trial = {
            "amount": suggested,
            "currency": contract.currency or "USD",
            "reason": "New talent with a strong portfolio. Award a small first milestone before funding the rest of the contract.",
        }

    return {
        "score": overall,
        "recommendation": recommendation,
        "newcomer": newcomer,
        "trial_milestone_suggestion": trial,
        "rationale": rationale,
        "dimension_scores": {
            "skills_match": skills,
            "portfolio_relevance": portfolio,
            "past_delivery": past_delivery,
            "communication": communication,
            "risk": max(5, 100 - completeness),
        },
        "profile_completeness": completeness,
        "past_contracts_count": past_count,
    }


def vet_application(
    session: Session,
    application: Application,
    freelancer: UserProfile,
    contract: Contract,
) -> VettingReport:
    past_count = count_past_contracts(session, freelancer.id)
    snapshot = application.portfolio_snapshot or freelancer.portfolio or []
    cover = application.cover_note or ""

    system = (
        "You are TrustBroker AI applicant vetting. Score a freelancer for one open contract. "
        "Never invent employers, GitHub stars, or completed jobs. "
        "If completed_contracts_count is 0, set past_delivery to the string insufficient_evidence, "
        "NOT a numeric 0. Weight skills_match and portfolio_relevance higher for newcomers. "
        "If profile_completeness < 40, recommendation must be insufficient_evidence. "
        "If newcomer with strong portfolio, recommendation new_talent. "
        "Return ONLY JSON: {score:int, recommendation:str, rationale:str, newcomer:bool, "
        "dimension_scores:{skills_match:int, portfolio_relevance:int, past_delivery:int|str, "
        "communication:int, risk:int}}"
    )
    user = (
        f"Contract: {contract.title} ({contract.category})\n"
        f"Brief: {contract.description[:800]}\n"
        f"Required skills: {contract.required_skills}\n"
        f"Freelancer: {freelancer.full_name}\n"
        f"Headline: {freelancer.headline}\n"
        f"Bio: {(freelancer.bio or '')[:500]}\n"
        f"Skills: {freelancer.skills}\n"
        f"Portfolio: {snapshot}\n"
        f"Cover: {cover[:1500]}\n"
        f"profile_completeness: {freelancer.profile_completeness}\n"
        f"completed_contracts_count: {past_count}\n"
    )
    llm, provider = call_ai_with_fallbacks(system, user)
    base = _deterministic_vet(freelancer, contract, cover, past_count, snapshot)
    if llm and isinstance(llm.get("score"), (int, float)):
        base["score"] = max(25, min(100, int(llm["score"])))
        if llm.get("rationale"):
            base["rationale"] = str(llm["rationale"])[:800]
        if llm.get("dimension_scores"):
            dims = dict(base["dimension_scores"])
            dims.update({k: v for k, v in llm["dimension_scores"].items() if v is not None})
            base["dimension_scores"] = dims
        rec = str(llm.get("recommendation") or base["recommendation"])
        base["recommendation"] = rec
        provider_used = provider or "groq"
    else:
        provider_used = "deterministic-fallback-engine"

    # Enforce newcomer rules even if the model ignored them.
    if past_count == 0:
        base["newcomer"] = True
        base["dimension_scores"]["past_delivery"] = "insufficient_evidence"
        if base["score"] == 0:
            base["score"] = 40
    completeness = freelancer.profile_completeness or 0
    if completeness < 40:
        base["recommendation"] = VettingRecommendation.INSUFFICIENT_EVIDENCE.value
        base["rationale"] = (
            "Profile completeness is under 40%. Ask the freelancer to finish bio, skills and portfolio."
        )
        base["score"] = min(int(base["score"]), 48)
    elif past_count == 0 and int(base["dimension_scores"].get("portfolio_relevance") or 0) >= 70:
        base["recommendation"] = VettingRecommendation.NEW_TALENT.value

    existing = session.exec(
        select(VettingReport).where(VettingReport.application_id == application.id)
    ).first()
    if existing:
        existing.score = int(base["score"])
        existing.recommendation = str(base["recommendation"])
        existing.reasons = base
        existing.model_used = provider_used
        session.add(existing)
        return existing

    report = VettingReport(
        application_id=application.id,
        score=int(base["score"]),
        recommendation=str(base["recommendation"]),
        reasons=base,
        model_used=provider_used,
    )
    session.add(report)
    return report
