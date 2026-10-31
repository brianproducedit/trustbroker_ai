import uuid
from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract
from app.models.delivery import Delivery
from app.models.milestone import AcceptanceCriterion, Milestone, MilestoneStatus
from app.models.verification import VerificationReport, CriterionResult
from app.schemas.delivery import DeliveryCreateRequest, DeliveryRead, RevisionRequest, OverrideReviewRequest
from app.services import delivery_service, verification_service
from app.utils.security import get_current_user, require_contract_party

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit milestone deliverables")
def submit_milestone_delivery(
    req: DeliveryCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Freelancer submits work evidence (repo link, live URL, description, uploaded files) for a milestone.

    AI verification is queued as a FastAPI BackgroundTask so the HTTP response
    is fast even on Render's free tier (which spins down idle services). Poll
    `GET /deliveries/{delivery_id}/verification-status` for the result.
    """
    auto_verify = req.auto_verify
    req.auto_verify = False  # Run verification in the background, not inline.

    result = delivery_service.submit_delivery(
        session=session,
        freelancer=current_user,
        req=req,
    )

    delivery_id = result["delivery"].id
    if auto_verify:
        background_tasks.add_task(
            verification_service.run_verification_background,
            req.contract_id,
            req.milestone_id,
            delivery_id,
            current_user.id,
        )
        result["verification"] = {
            "status": "queued",
            "delivery_id": str(delivery_id),
            "milestone_status": MilestoneStatus.VERIFYING.value,
        }

    return result


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


@router.get("/{delivery_id}/verification-status", summary="Get AI verification status for a delivery")
def get_delivery_verification_status(
    delivery_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Poll endpoint for background AI verification jobs (free-tier-safe offload)."""
    delivery = session.get(Delivery, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    contract = session.get(Contract, delivery.contract_id)
    require_contract_party(current_user, contract)

    milestone = session.get(Milestone, delivery.milestone_id)

    report = session.exec(
        select(VerificationReport)
        .where(VerificationReport.delivery_id == delivery.id)
        .order_by(VerificationReport.assessed_at.desc())
    ).first()

    if report is None:
        queued = milestone is not None and milestone.status in (
            MilestoneStatus.SUBMITTED,
            MilestoneStatus.VERIFYING,
        )
        return {
            "delivery_id": str(delivery.id),
            "status": "queued" if queued else "pending",
            "milestone_status": milestone.status.value if milestone else None,
            "report": None,
        }

    criterion_rows = session.exec(
        select(CriterionResult, AcceptanceCriterion.title)
        .join(AcceptanceCriterion, AcceptanceCriterion.id == CriterionResult.criterion_id)
        .where(CriterionResult.report_id == report.id)
    ).all()

    criterion_evaluations = [
        {
            "criterion_id": str(cr.criterion_id),
            "title": title or "Verified criterion",
            "status": "pass" if cr.passed else "fail",
            "passed": cr.passed,
            "score": cr.score,
            "explanation": cr.explanation,
            "evidence_match_snippet": "",
        }
        for cr, title in criterion_rows
    ]

    return {
        "delivery_id": str(delivery.id),
        "status": "completed",
        "milestone_status": milestone.status.value if milestone else None,
        "report": {
            "report_id": str(report.id),
            "overall_score": report.overall_score,
            "passed": report.passed,
            "summary_analysis": report.summary_analysis,
            "requires_human_review": report.requires_human_review,
            "model_used": report.model_used,
            "criterion_evaluations": criterion_evaluations,
        },
    }


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


@router.post("/{contract_id}/{milestone_id}/override-review", summary="Client manual approval of milestone via review override")
def override_milestone_review(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    req: OverrideReviewRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Client approves milestone delivery via human review override (Roadmap §7.2)."""
    return delivery_service.override_review(
        session=session,
        contract_id=contract_id,
        milestone_id=milestone_id,
        client=current_user,
        reason=req.reason,
    )

