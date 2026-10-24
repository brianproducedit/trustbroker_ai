import uuid
from typing import Any, Dict
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.models.contract import Contract, ContractStatus
from app.models.milestone import Milestone, MilestoneStatus, AcceptanceCriterion, CriterionStatus, PaymentStatus
from app.models.delivery import Delivery, DeliveryFile
from app.models.verification import VerificationReport, CriterionResult
from app.models.user import UserProfile
from app.services import ai_provider
from app.services.audit_service import log_audit_event


def orchestrate_delivery_verification(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    delivery_id: uuid.UUID,
    actor: UserProfile,
) -> Dict[str, Any]:
    """Execute AI verification for a delivery submission against its milestone acceptance criteria."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="Milestone not found for this contract")

    delivery = session.get(Delivery, delivery_id)
    if not delivery or delivery.milestone_id != milestone.id:
        raise HTTPException(status_code=404, detail="Delivery not found for this milestone")

    # Fetch acceptance criteria
    criteria = list(
        session.exec(
            select(AcceptanceCriterion).where(AcceptanceCriterion.milestone_id == milestone.id)
        ).all()
    )
    if not criteria:
        raise HTTPException(status_code=400, detail="Milestone has no acceptance criteria defined")

    # Fetch attached delivery files
    delivery_files = list(
        session.exec(
            select(DeliveryFile).where(DeliveryFile.delivery_id == delivery.id)
        ).all()
    )
    file_names = [f.file_name for f in delivery_files]

    # Prepare input for AI evaluation
    criteria_payload = [
        {
            "id": str(c.id),
            "title": c.title,
            "description": c.description,
            "evidence_type": c.evidence_type,
        }
        for c in criteria
    ]

    # Set milestone to verifying
    milestone.status = MilestoneStatus.VERIFYING
    session.add(milestone)
    session.commit()

    # Call AI verification model (Groq -> OpenRouter -> Deterministic Fallback)
    eval_result = ai_provider.evaluate_delivery_against_criteria(
        milestone_title=milestone.title,
        milestone_description=milestone.description,
        criteria=criteria_payload,
        delivery_description=delivery.description,
        repo_url=delivery.repo_url,
        live_url=delivery.live_url,
        file_names=file_names,
    )

    overall_score = int(eval_result.get("overall_score", 0))
    passed = bool(eval_result.get("passed", False)) and (overall_score >= 80)
    summary_analysis = str(eval_result.get("summary_analysis", ""))
    requires_human_review = bool(eval_result.get("requires_human_review", False))
    provider_used = str(eval_result.get("provider_used", ai_provider.settings.groq_model))

    # Create VerificationReport
    report = VerificationReport(
        delivery_id=delivery.id,
        contract_id=contract.id,
        milestone_id=milestone.id,
        overall_score=overall_score,
        passed=passed,
        summary_analysis=summary_analysis,
        model_used=provider_used,
        requires_human_review=requires_human_review,
    )
    session.add(report)
    session.flush()

    # Map criterion results and update criteria in DB
    evaluations = eval_result.get("criterion_evaluations", [])
    eval_by_id = {e.get("criterion_id"): e for e in evaluations}

    criterion_results_list = []
    for c in criteria:
        c_eval = eval_by_id.get(str(c.id))
        c_passed = bool(c_eval.get("passed", False)) if c_eval else False
        c_score = int(c_eval.get("score", 0)) if c_eval else 0
        c_explanation = str(c_eval.get("explanation", "")) if c_eval else "No evaluation provided"
        c_snippet = str(c_eval.get("evidence_match_snippet", "")) if c_eval else ""

        # Update criterion
        c.status = CriterionStatus.PASS if c_passed else CriterionStatus.FAIL
        c.ai_confidence = float(c_score) / 100.0
        c.evidence_match_snippet = c_snippet
        c.feedback = c_explanation
        session.add(c)

        # Create CriterionResult record
        c_result = CriterionResult(
            report_id=report.id,
            criterion_id=c.id,
            passed=c_passed,
            score=c_score,
            explanation=c_explanation,
        )
        session.add(c_result)
        criterion_results_list.append(c_result)

    # Deterministic policy update on Milestone & Contract
    if passed:
        milestone.status = MilestoneStatus.VERIFIED
        # If funds were staged in PayPal sandbox, authorize release
        if milestone.payment_status == PaymentStatus.STAGED_IN_SANDBOX:
            milestone.payment_status = PaymentStatus.RELEASE_AUTHORIZED
    else:
        milestone.status = MilestoneStatus.REVISION_REQUESTED

    # Check if all milestones are verified or settled
    all_milestones = list(
        session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all()
    )
    all_done = all(m.status in [MilestoneStatus.VERIFIED, MilestoneStatus.SETTLED] for m in all_milestones)
    if all_done:
        contract.status = ContractStatus.COMPLETED

    session.commit()
    session.refresh(report)

    # Log audit event
    action_name = "delivery_verified_passed" if passed else "delivery_verified_revision_requested"
    log_audit_event(
        session=session,
        action=action_name,
        details=(
            f"AI Verification completed for milestone '{milestone.title}'. "
            f"Overall score: {overall_score}/100. Passed: {passed}."
        ),
        contract_id=contract.id,
        actor_id=actor.id,
        actor_name="TrustBroker AI Verification Engine",
        metadata={
            "report_id": str(report.id),
            "score": overall_score,
            "passed": passed,
            "milestone_id": str(milestone.id),
        },
    )

    return {
        "report_id": str(report.id),
        "overall_score": overall_score,
        "passed": passed,
        "summary_analysis": summary_analysis,
        "requires_human_review": requires_human_review,
        "milestone_status": milestone.status.value,
        "payment_status": milestone.payment_status.value,
        "criterion_evaluations": evaluations,
    }
