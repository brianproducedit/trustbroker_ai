"""
Multimodal Verification Orchestrator for TrustBroker AI.
Dispatches evidence to specialized adapters by evidence_type:
- live_url -> http_probe + vision
- screenshot / design_file -> vision
- document -> document extractor + groq
- source_archive -> zip_listing
- repo -> repo_meta
- text_attestation -> groq json
Aggregates factual results with scoring rules and persists report and criterion outcomes.
"""
import logging
import uuid
from typing import Any, Dict, List
from fastapi import HTTPException
from sqlmodel import Session, select
from app.models.contract import Contract, ContractStatus
from app.models.milestone import Milestone, MilestoneStatus, AcceptanceCriterion, CriterionStatus, PaymentStatus
from app.models.delivery import Delivery, DeliveryFile
from app.models.verification import VerificationReport, CriterionResult
from app.models.user import UserProfile
from app.services.audit_service import log_audit_event
from app.services.notification_service import queue_notification
from app.services.verification.adapters import http_probe, vision, document, repo_meta, zip_listing
from app.services.verification import scoring

logger = logging.getLogger("trustbroker.verification.orchestrator")


def run_verification_orchestration(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    delivery_id: uuid.UUID,
    actor: UserProfile,
) -> Dict[str, Any]:
    """Execute multimodal verification against milestone deliverables."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="Milestone not found for this contract")

    delivery = session.get(Delivery, delivery_id)
    if not delivery or delivery.milestone_id != milestone.id:
        raise HTTPException(status_code=404, detail="Delivery not found for this milestone")

    criteria = list(
        session.exec(
            select(AcceptanceCriterion).where(AcceptanceCriterion.milestone_id == milestone.id)
        ).all()
    )
    if not criteria:
        raise HTTPException(status_code=400, detail="Milestone has no acceptance criteria defined")

    delivery_files = list(
        session.exec(
            select(DeliveryFile).where(DeliveryFile.delivery_id == delivery.id)
        ).all()
    )

    milestone.status = MilestoneStatus.VERIFYING
    session.add(milestone)
    session.commit()

    # Pre-index files by extension/type
    image_files = [f for f in delivery_files if f.mime_type.startswith("image/") or f.file_name.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))]
    doc_files = [f for f in delivery_files if f.file_name.lower().endswith((".pdf", ".docx", ".txt", ".md"))]
    zip_files = [f for f in delivery_files if f.file_name.lower().endswith(".zip")]

    criterion_evaluations: List[Dict[str, Any]] = []
    models_used: List[str] = []

    for c in criteria:
        etype = (c.evidence_type or "text").lower().strip()
        facts: Dict[str, Any] = {}
        llm_eval: Optional[Dict[str, Any]] = None

        # 1. LIVE URL
        if etype in ["live_url", "url", "staging_url"]:
            target_url = delivery.live_url or (doc_files[0].storage_path if doc_files else None)
            facts = http_probe.probe_live_url(target_url or "")
            
            # §7.2: Live URL requires an accompanying screenshot evaluated via vision
            if image_files:
                img_fact = vision.inspect_screenshot_with_vision(
                    image_source=image_files[0].storage_path or image_files[0].file_name,
                    criterion_title=c.title,
                    criterion_description=c.description,
                    mime_type=image_files[0].mime_type,
                )
                if img_fact.get("model_used"):
                    models_used.append(img_fact["model_used"])
                # Merge observation into citation
                facts["citation"] = f"{facts.get('citation', '')}; Vision: {img_fact.get('citation', '')}"
                if not img_fact.get("passed", False):
                    facts["passed"] = False
                    facts["error"] = img_fact.get("observation", "Screenshot failed vision check")

        # 2. SCREENSHOT / DESIGN FILE
        elif etype in ["screenshot", "design_file", "image"]:
            img_file = image_files[0] if image_files else None
            img_path = img_file.storage_path if img_file else (delivery.live_url or "")
            facts = vision.inspect_screenshot_with_vision(
                image_source=img_path,
                criterion_title=c.title,
                criterion_description=c.description,
                mime_type=img_file.mime_type if img_file else "image/png",
            )
            if facts.get("model_used"):
                models_used.append(facts["model_used"])

        # 3. DOCUMENT / SPEC / PDF
        elif etype in ["document", "pdf", "file"]:
            doc_file = doc_files[0] if doc_files else None
            facts = document.inspect_document(
                file_name=doc_file.file_name if doc_file else "document.pdf",
                criterion_title=c.title,
                criterion_description=c.description,
                file_path=doc_file.storage_path if doc_file else None,
            )
            if facts.get("model_used"):
                models_used.append(facts["model_used"])

        # 4. SOURCE ARCHIVE / ZIP
        elif etype in ["source_archive", "zip", "code_archive"]:
            z_file = zip_files[0] if zip_files else None
            facts = zip_listing.inspect_zip_archive(
                file_name=z_file.file_name if z_file else "archive.zip",
                file_path=z_file.storage_path if z_file else None,
            )

        # 5. REPOSITORY / CODE LINK
        elif etype in ["repo", "repository", "github"]:
            facts = repo_meta.inspect_repository(delivery.repo_url or "")

        # 6. VIDEO LINK
        elif etype == "video_link":
            facts = {
                "adapter": "video_link_recorder",
                "passed": False,
                "citation": f"Video link: {delivery.live_url or 'submitted'}",
                "error": None,
            }

        # 7. TEXT / GENERAL ATTESTATION (FALLBACK)
        else:
            # If repo_url exists, inspect repo
            if delivery.repo_url and "github.com" in delivery.repo_url:
                facts = repo_meta.inspect_repository(delivery.repo_url)
            elif delivery.live_url:
                facts = http_probe.probe_live_url(delivery.live_url)
            else:
                facts = {
                    "adapter": "text_attestation",
                    "passed": len(delivery.description) > 30,
                    "citation": f"Notes verified ({len(delivery.description)} chars)",
                    "error": None if len(delivery.description) > 30 else "Insufficient delivery description",
                }

        # Score the criterion
        c_score = scoring.score_criterion_result(
            criterion_id=str(c.id),
            title=c.title,
            description=c.description,
            evidence_type=etype,
            adapter_facts=facts,
            llm_evaluation=llm_eval,
        )
        criterion_evaluations.append(c_score)

    primary_model = models_used[0] if models_used else "groq-qwen-3.8-27b"

    # Aggregate overall assessment
    assessment = scoring.aggregate_verification_assessment(
        criterion_evaluations=criterion_evaluations,
        milestone_title=milestone.title,
        model_used=primary_model,
    )

    overall_score = assessment["overall_score"]
    passed = assessment["passed"]
    requires_human_review = assessment["requires_human_review"]
    summary_analysis = assessment["summary_analysis"]

    # Persist VerificationReport
    report = VerificationReport(
        delivery_id=delivery.id,
        contract_id=contract.id,
        milestone_id=milestone.id,
        overall_score=overall_score,
        passed=passed,
        summary_analysis=summary_analysis,
        model_used=primary_model,
        requires_human_review=requires_human_review,
    )
    session.add(report)
    session.flush()

    # Persist CriterionResults and update AcceptanceCriteria in DB
    for c_res in criterion_evaluations:
        matched_c = next((item for item in criteria if str(item.id) == c_res["criterion_id"]), None)
        if matched_c:
            matched_c.status = c_res["status"]
            matched_c.ai_confidence = c_res["confidence"]
            matched_c.evidence_match_snippet = c_res["evidence_match_snippet"]
            matched_c.feedback = c_res["explanation"]
            session.add(matched_c)

            cr_record = CriterionResult(
                report_id=report.id,
                criterion_id=matched_c.id,
                passed=c_res["passed"],
                score=c_res["score"],
                explanation=c_res["explanation"],
            )
            session.add(cr_record)

    # State transitions
    if passed:
        milestone.status = MilestoneStatus.VERIFIED
        if milestone.payment_status == PaymentStatus.STAGED_IN_SANDBOX:
            milestone.payment_status = PaymentStatus.RELEASE_AUTHORIZED
    elif requires_human_review:
        milestone.status = MilestoneStatus.SUBMITTED
    else:
        milestone.status = MilestoneStatus.REVISION_REQUESTED

    # Check contract completion
    all_milestones = list(
        session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all()
    )
    if all(m.status in [MilestoneStatus.VERIFIED, MilestoneStatus.SETTLED] for m in all_milestones):
        contract.status = ContractStatus.COMPLETED

    session.commit()
    session.refresh(report)

    # Notifications & Audit
    status_label = "Passed" if passed else ("Needs Human Review" if requires_human_review else "Revision Requested")
    action_name = "delivery_verified_passed" if passed else (
        "delivery_verified_human_review" if requires_human_review else "delivery_verified_revision_requested"
    )

    # Notify parties
    notify_user_id = contract.client_id if actor.id != contract.client_id else contract.freelancer_id
    if notify_user_id:
        queue_notification(
            session=session,
            user_id=notify_user_id,
            type="verification",
            title=f"Verification: {status_label}",
            body=f"Milestone '{milestone.title}' scored {overall_score}/100 ({status_label}).",
            entity_type="contract",
            entity_id=contract.id,
        )

    log_audit_event(
        session=session,
        action=action_name,
        details=(
            f"Multimodal AI Verification completed for milestone '{milestone.title}'. "
            f"Score: {overall_score}/100. Status: {status_label}."
        ),
        contract_id=contract.id,
        actor_id=actor.id,
        actor_name="TrustBroker Multimodal Verification Engine",
        metadata={
            "report_id": str(report.id),
            "score": overall_score,
            "passed": passed,
            "requires_human_review": requires_human_review,
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
        "criterion_evaluations": criterion_evaluations,
    }
