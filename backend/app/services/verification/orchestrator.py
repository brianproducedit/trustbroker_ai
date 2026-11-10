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
from typing import Any, Dict, List, Optional
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
from app.services.verification import evidence_loader
from app.services import ai_provider

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

    try:
        # Pre-index files by extension/type
        image_files = [f for f in delivery_files if f.mime_type.startswith("image/") or f.file_name.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))]
        doc_files = [f for f in delivery_files if f.file_name.lower().endswith((".pdf", ".docx", ".txt", ".md"))]
        zip_files = [f for f in delivery_files if f.file_name.lower().endswith(".zip")]

        criterion_facts: Dict[str, Dict[str, Any]] = {}
        criterion_etypes: Dict[str, str] = {}
        models_used: List[str] = []

        for c in criteria:
            cid = str(c.id)
            etype = (c.evidence_type or "text").lower().strip()
            criterion_etypes[cid] = etype
            facts: Dict[str, Any] = {}

            title_lower = (c.title or "").lower()
            desc_lower = (c.description or "").lower()
            is_repo_criterion = etype in ["repo", "repository", "github"] or any(
                k in title_lower or k in desc_lower
                for k in ["repo", "github", "git repository", "repository initialized", "repository setup", "codebase"]
            )

            # 1. REPOSITORY / CODE LINK
            if is_repo_criterion and delivery.repo_url:
                facts = repo_meta.inspect_repository(delivery.repo_url)

            # 2. LIVE URL
            elif etype in ["live_url", "url", "staging_url"]:
                target_url = delivery.live_url or (doc_files[0].storage_path if doc_files else None)
                facts = http_probe.probe_live_url(target_url or "")

                # §7.2: Live URL requires an accompanying screenshot evaluated via vision
                if image_files:
                    _img_bytes = evidence_loader.load_evidence_bytes(image_files[0].storage_path or "")
                    img_fact = vision.inspect_screenshot_with_vision(
                        image_source=image_files[0].storage_path or image_files[0].file_name,
                        criterion_title=c.title,
                        criterion_description=c.description,
                        mime_type=image_files[0].mime_type,
                        local_file_bytes=_img_bytes,
                    )
                    if img_fact.get("model_used"):
                        models_used.append(img_fact["model_used"])
                    # Merge observation into citation
                    facts["citation"] = f"{facts.get('citation', '')}; Vision: {img_fact.get('citation', '')}"
                    if not img_fact.get("passed", False):
                        facts["passed"] = False
                        facts["error"] = img_fact.get("observation", "Screenshot failed vision check")
                    elif not facts.get("passed", False) and img_fact.get("passed", False):
                        # If live URL was blocked by cloud DDoS challenge but screenshot is verified by vision
                        facts["passed"] = True
                        facts["error"] = None

            # 3. SCREENSHOT / DESIGN FILE
            elif etype in ["screenshot", "design_file", "image"]:
                img_file = image_files[0] if image_files else None
                img_path = img_file.storage_path if img_file else (delivery.live_url or "")
                _img_bytes = evidence_loader.load_evidence_bytes(img_file.storage_path or "") if img_file else None
                facts = vision.inspect_screenshot_with_vision(
                    image_source=img_path,
                    criterion_title=c.title,
                    criterion_description=c.description,
                    mime_type=img_file.mime_type if img_file else "image/png",
                    local_file_bytes=_img_bytes,
                )
                if facts.get("model_used"):
                    models_used.append(facts["model_used"])

            # 4. DOCUMENT / SPEC / PDF / ARCHITECTURE DIAGRAM FILE
            elif etype in ["document", "pdf", "file"]:
                if doc_files:
                    doc_file = doc_files[0]
                    _doc_bytes = evidence_loader.load_evidence_bytes(doc_file.storage_path or "")
                    facts = document.inspect_document(
                        file_name=doc_file.file_name,
                        criterion_title=c.title,
                        criterion_description=c.description,
                        file_path=doc_file.storage_path if not _doc_bytes else None,
                        file_bytes=_doc_bytes,
                    )
                elif image_files:
                    # Freelancer provided an image diagram/screenshot for this file criterion
                    img_file = image_files[0]
                    _img_bytes = evidence_loader.load_evidence_bytes(img_file.storage_path or "")
                    facts = vision.inspect_screenshot_with_vision(
                        image_source=img_file.storage_path or img_file.file_name,
                        criterion_title=c.title,
                        criterion_description=c.description,
                        mime_type=img_file.mime_type or "image/png",
                        local_file_bytes=_img_bytes,
                    )
                else:
                    facts = document.inspect_document(
                        file_name="document.pdf",
                        criterion_title=c.title,
                        criterion_description=c.description,
                        file_path=None,
                    )
                if facts.get("model_used"):
                    models_used.append(facts["model_used"])

            # 5. SOURCE ARCHIVE / ZIP
            elif etype in ["source_archive", "zip", "code_archive"]:
                z_file = zip_files[0] if zip_files else None
                _zip_bytes = evidence_loader.load_evidence_bytes(z_file.storage_path or "") if z_file else None
                facts = zip_listing.inspect_zip_archive(
                    file_name=z_file.file_name if z_file else "archive.zip",
                    file_path=z_file.storage_path if z_file else None,
                    file_bytes=_zip_bytes,
                )

            # 6. REPOSITORY / CODE LINK (explicit etype)
            elif etype in ["repo", "repository", "github"]:
                facts = repo_meta.inspect_repository(delivery.repo_url or "")

            # 7. VIDEO LINK
            elif etype == "video_link":
                facts = {
                    "adapter": "video_link_recorder",
                    "passed": False,
                    "needs_review": True,
                    "citation": f"Video link: {delivery.live_url or 'submitted'}",
                    "error": None,
                }

            # 8. TEXT / GENERAL ATTESTATION (FALLBACK)
            else:
                if delivery.repo_url and "github.com" in delivery.repo_url:
                    facts = repo_meta.inspect_repository(delivery.repo_url)
                elif delivery.live_url:
                    facts = http_probe.probe_live_url(delivery.live_url)
                else:
                    # Text description alone is NOT evidence — it is a freelancer attestation.
                    facts = {
                        "adapter": "text_attestation",
                        "passed": False,
                        "needs_review": True,
                        "citation": f"Delivery description submitted ({len(delivery.description)} chars) — requires AI/human assessment",
                        "error": None,
                    }

            if "status_code" in facts:
                facts.setdefault("adapter", "http_probe")
                facts["semantic_evidence"] = False
            elif facts.get("adapter") in {"github_api", "zip_listing"}:
                facts["semantic_evidence"] = False
            criterion_facts[cid] = facts

        # ------------------------------------------------------------------ #
        # AI Criterion Evaluator — connected to real orchestration path       #
        # ------------------------------------------------------------------ #
        ai_criteria_input = [
            {
                "id": str(c.id),
                "title": c.title,
                "description": c.description or "",
                "evidence_type": criterion_etypes.get(str(c.id), "text"),
            }
            for c in criteria
        ]

        uploaded_file_names = [df.file_name for df in delivery_files] if delivery_files else []

        ai_result = ai_provider.evaluate_delivery_against_criteria(
            milestone_title=milestone.title,
            milestone_description=milestone.description or "",
            criteria=ai_criteria_input,
            delivery_description=delivery.description or "",
            repo_url=delivery.repo_url or None,
            live_url=delivery.live_url or None,
            file_names=uploaded_file_names or None,
            evidence_findings=criterion_facts,
        )

        ai_provider_used: str = ai_result.get("provider_used", "fallback:none")
        ai_criterion_evals: List[Dict[str, Any]] = ai_result.get("criterion_evaluations", [])

        ai_eval_by_id: Dict[str, Dict[str, Any]] = {}
        for ae in ai_criterion_evals:
            cid = str(ae.get("criterion_id", ""))
            if cid:
                raw_passed = ae.get("passed")
                raw_score = ae.get("score", 50)
                raw_confidence = ae.get("confidence")
                is_valid_shape = (
                    isinstance(raw_passed, bool)
                    and isinstance(raw_score, int)
                    and not isinstance(raw_score, bool)
                    and 0 <= raw_score <= 100
                    and isinstance(raw_confidence, (int, float))
                    and not isinstance(raw_confidence, bool)
                    and 0 <= raw_confidence <= 1
                    and isinstance(ae.get("explanation"), str)
                    and isinstance(ae.get("evidence_match_snippet"), str)
                )
                if not is_valid_shape:
                    logger.warning(
                        "AI evaluator returned malformed values for criterion %s — using NEEDS_REVIEW",
                        cid,
                    )
                # Detect duplicate criterion IDs from AI response
                if cid in ai_eval_by_id:
                    logger.warning(
                        f"AI evaluator returned duplicate evaluation for criterion {cid} — marking NEEDS_REVIEW"
                    )
                    ai_eval_by_id[cid] = {
                        "passed": False,
                        "score": 50,
                        "confidence": 0.0,
                        "explanation": "AI evaluator returned duplicate evaluations for this criterion — manual review required.",
                        "cited_snippet": "",
                        "needs_review": True,
                    }
                else:
                    ai_eval_by_id[cid] = {
                        "passed": raw_passed if is_valid_shape else False,
                        "score": raw_score if is_valid_shape else 50,
                        "confidence": float(raw_confidence) if is_valid_shape else 0.0,
                        "explanation": (
                            ae["explanation"]
                            if is_valid_shape
                            else "AI evaluator returned malformed values — manual review required."
                        ),
                        "cited_snippet": ae["evidence_match_snippet"] if is_valid_shape else "",
                        "needs_review": not is_valid_shape,
                    }

        # Enforce: every criterion must have exactly one AI evaluation.
        # Any criterion missing from AI response is flagged NEEDS_REVIEW here
        # so scoring.py never sees None as "optional".
        criteria_ids_expected = {str(c.id) for c in criteria}
        criteria_ids_got = set(ai_eval_by_id.keys())
        unknown_ids = criteria_ids_got - criteria_ids_expected
        if unknown_ids:
            logger.warning(
                "AI evaluator returned unknown criterion IDs: %s — marking response for review",
                unknown_ids,
            )
            for unknown_id in unknown_ids:
                ai_eval_by_id.pop(unknown_id, None)
            for expected_id in criteria_ids_expected & criteria_ids_got:
                ai_eval_by_id[expected_id]["needs_review"] = True
                ai_eval_by_id[expected_id]["passed"] = False
                ai_eval_by_id[expected_id]["explanation"] = (
                    "AI evaluator returned an unknown criterion ID — manual review required."
                )
        missing_ids = criteria_ids_expected - criteria_ids_got
        if missing_ids:
            logger.warning(
                f"AI evaluator did not return evaluations for criteria: {missing_ids} — marking NEEDS_REVIEW"
            )
            for mid in missing_ids:
                ai_eval_by_id[mid] = {
                    "passed": False,
                    "score": 50,
                    "confidence": 0.0,
                    "explanation": "AI evaluator did not return an assessment for this criterion — manual review required.",
                    "cited_snippet": "",
                    "needs_review": True,
                }

        # Score each criterion combining adapter facts + AI evaluation
        criterion_evaluations: List[Dict[str, Any]] = []
        for c in criteria:
            cid = str(c.id)
            etype = criterion_etypes.get(cid, "text")
            facts = criterion_facts.get(cid, {})
            llm_eval_for_criterion = ai_eval_by_id.get(cid)

            c_score = scoring.score_criterion_result(
                criterion_id=cid,
                title=c.title,
                description=c.description,
                evidence_type=etype,
                adapter_facts=facts,
                llm_evaluation=llm_eval_for_criterion,
            )
            criterion_evaluations.append(c_score)

        # Truthful model attribution:
        # If vision/document models ran, record them.
        # Otherwise, if AI evaluator ran (not fallback), record that.
        # Otherwise, record "fallback:none" — NEVER fabricate a model name!
        if models_used:
            primary_model = models_used[0]
        elif ai_provider_used and not ai_provider_used.startswith("fallback"):
            primary_model = ai_provider_used
        else:
            primary_model = "fallback:none"

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

        # State transitions: AI verification updates work status (VERIFIED / SUBMITTED / REVISION_REQUESTED).
        # Payment status remains STAGED_IN_SANDBOX until client explicitly authorizes disbursement.
        if passed:
            milestone.status = MilestoneStatus.VERIFIED
        elif requires_human_review:
            milestone.status = MilestoneStatus.SUBMITTED
        else:
            milestone.status = MilestoneStatus.REVISION_REQUESTED

        # Contract completion is only reached after financial settlement of all milestones (in payment_service)
        session.add(milestone)
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

    except Exception as exc:
        # If verification fails unexpectedly, revert milestone to SUBMITTED (Needs Review)
        # so it is never stuck in VERIFYING forever. Human review will be required.
        logger.exception(
            "Verification engine error for milestone %s — reverting to SUBMITTED for human review.",
            milestone_id,
        )
        milestone.status = MilestoneStatus.SUBMITTED
        session.add(milestone)
        session.commit()
        raise HTTPException(
            status_code=500,
            detail="Verification engine error — milestone set to Needs Review.",
        ) from exc
