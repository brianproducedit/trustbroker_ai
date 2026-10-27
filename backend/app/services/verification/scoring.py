"""
Scoring and Decision Engine for Multimodal Milestone Verification.
Enforces the strict judging rules defined in §7.2 of the TrustBroker AI Roadmap:
- Pass: Evidence directly supports the criterion (factual verification).
- Fail: Required evidence missing, URL down, or criterion explicitly unmet.
- Needs Review: Subjective design taste, copywriting quality, unreadable files.
- Overall Pass only if EVERY criterion passes and no adapter hard-fails.
"""
import logging
from typing import Any, Dict, List, Optional, Tuple
from app.models.milestone import CriterionStatus

logger = logging.getLogger("trustbroker.verification.scoring")

# Keywords that indicate subjective criteria requiring human review
SUBJECTIVE_KEYWORDS = {
    "taste", "aesthetic", "professional look", "modern look", "beautiful",
    "compelling", "brand feel", "engaging", "creative", "clean layout", "appealing"
}


def is_subjective_criterion(title: str, description: str) -> bool:
    """Detect whether a criterion relies on subjective human judgment."""
    combined = f"{title} {description}".lower()
    return any(keyword in combined for keyword in SUBJECTIVE_KEYWORDS)


def score_criterion_result(
    criterion_id: str,
    title: str,
    description: str,
    evidence_type: str,
    adapter_facts: Dict[str, Any],
    llm_evaluation: Optional[Dict[str, Any]] = None,
    auto_pass_allowed: bool = False,
) -> Dict[str, Any]:
    """Score a single acceptance criterion by combining adapter facts and AI evaluation."""
    adapter_name = adapter_facts.get("adapter", "general")
    adapter_passed = adapter_facts.get("passed", False)
    adapter_error = adapter_facts.get("error")
    citation = adapter_facts.get("citation", "")

    # Hard failure: adapter failed (e.g., 404 URL, corrupt ZIP, missing evidence)
    if not adapter_passed and adapter_error:
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.FAIL,
            "passed": False,
            "score": 0,
            "confidence": 0.95,
            "explanation": f"Factual check failed via {adapter_name}: {adapter_error}",
            "evidence_match_snippet": citation,
            "adapter_used": adapter_name,
            "requires_review": False,
        }

    # Video link: always defaults to Needs Review as specified in §7.2 / P2
    if evidence_type == "video_link":
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.NEEDS_REVIEW,
            "passed": False,
            "score": 70,
            "confidence": 0.60,
            "explanation": "Video evidence submitted. Manual client playback required for verification.",
            "evidence_match_snippet": citation or "Video link pending human review",
            "adapter_used": adapter_name,
            "requires_review": True,
        }

    # Subjective criteria check: defaults to Needs Review unless auto_pass_allowed
    is_subjective = is_subjective_criterion(title, description)
    if is_subjective and not auto_pass_allowed:
        base_score = 80 if adapter_passed else 50
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.NEEDS_REVIEW,
            "passed": False,
            "score": base_score,
            "confidence": 0.70,
            "explanation": (
                "Criterion involves subjective visual taste or styling. "
                "Flagged for human confirmation before automatic fund release."
            ),
            "evidence_match_snippet": citation,
            "adapter_used": adapter_name,
            "requires_review": True,
        }

    # LLM evaluation integration (if available)
    if llm_evaluation:
        llm_passed = bool(llm_evaluation.get("passed", False))
        llm_score = int(llm_evaluation.get("score", 80 if llm_passed else 30))
        llm_conf = float(llm_evaluation.get("confidence", 0.85))
        llm_expl = str(llm_evaluation.get("explanation", ""))
        llm_snip = str(llm_evaluation.get("cited_snippet", citation))

        if llm_passed and adapter_passed and llm_score >= 75:
            return {
                "criterion_id": criterion_id,
                "title": title,
                "status": CriterionStatus.PASS,
                "passed": True,
                "score": llm_score,
                "confidence": llm_conf,
                "explanation": llm_expl or f"Verified by {adapter_name} and AI auditor.",
                "evidence_match_snippet": llm_snip,
                "adapter_used": adapter_name,
                "requires_review": False,
            }
        else:
            return {
                "criterion_id": criterion_id,
                "title": title,
                "status": CriterionStatus.FAIL,
                "passed": False,
                "score": llm_score,
                "confidence": llm_conf,
                "explanation": llm_expl or "Deliverables did not satisfy criterion requirements.",
                "evidence_match_snippet": llm_snip,
                "adapter_used": adapter_name,
                "requires_review": False,
            }

    # Pure adapter evaluation
    if adapter_passed:
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.PASS,
            "passed": True,
            "score": 90,
            "confidence": 0.88,
            "explanation": f"Objective evidence validated via {adapter_name}.",
            "evidence_match_snippet": citation,
            "adapter_used": adapter_name,
            "requires_review": False,
        }
    else:
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.FAIL,
            "passed": False,
            "score": 25,
            "confidence": 0.90,
            "explanation": f"Evidence did not pass verification via {adapter_name}.",
            "evidence_match_snippet": citation,
            "adapter_used": adapter_name,
            "requires_review": False,
        }


def aggregate_verification_assessment(
    criterion_evaluations: List[Dict[str, Any]],
    milestone_title: str,
    model_used: str,
) -> Dict[str, Any]:
    """Aggregate per-criterion evaluations into overall milestone verification decision."""
    if not criterion_evaluations:
        return {
            "overall_score": 0,
            "passed": False,
            "requires_human_review": False,
            "summary_analysis": "No criteria evaluated.",
            "criterion_evaluations": [],
        }

    total_score = sum(int(c.get("score", 0)) for c in criterion_evaluations)
    overall_score = round(total_score / len(criterion_evaluations))

    all_passed = all(c.get("status") == CriterionStatus.PASS for c in criterion_evaluations)
    has_needs_review = any(c.get("status") == CriterionStatus.NEEDS_REVIEW for c in criterion_evaluations)
    has_failed = any(c.get("status") == CriterionStatus.FAIL for c in criterion_evaluations)

    overall_passed = all_passed and (overall_score >= 80)
    requires_human_review = has_needs_review or (not overall_passed and not has_failed)

    # Build summary explanation citing facts
    citations = [c.get("evidence_match_snippet", "") for c in criterion_evaluations if c.get("evidence_match_snippet")]
    citation_summary = "; ".join(citations[:3])

    if overall_passed:
        summary_analysis = (
            f"All {len(criterion_evaluations)} criteria for '{milestone_title}' met or exceeded requirements "
            f"with an overall score of {overall_score}/100. Verification confirmed: {citation_summary}."
        )
    elif requires_human_review:
        summary_analysis = (
            f"Milestone '{milestone_title}' scored {overall_score}/100. Subjective or pending criteria "
            "require human confirmation before automated fund release. Evidence: " + citation_summary
        )
    else:
        summary_analysis = (
            f"Milestone '{milestone_title}' scored {overall_score}/100 and failed required acceptance criteria. "
            "A revision has been requested. Identified gaps: " + citation_summary
        )

    return {
        "overall_score": overall_score,
        "passed": overall_passed,
        "requires_human_review": requires_human_review,
        "summary_analysis": summary_analysis,
        "model_used": model_used,
        "criterion_evaluations": criterion_evaluations,
    }
