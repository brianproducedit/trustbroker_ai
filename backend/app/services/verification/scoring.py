"""
Scoring and Decision Engine for Multimodal Milestone Verification.
Enforces the strict judging rules defined in §7.2 of the TrustBroker AI Roadmap:
- Pass: Evidence directly supports the criterion (factual verification).
- Fail: Required evidence missing, URL down or criterion explicitly unmet.
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


def _client_facing_evidence(citation: str, facts: Dict[str, Any]) -> str:
    """Translate adapter diagnostics into useful plain-English evidence."""
    raw = str(citation or "").strip()
    status_code = facts.get("status_code")
    title = str(facts.get("title") or "").lower()

    if status_code in {401, 403, 429} or "security checkpoint" in title:
        return (
            "The website responded, but its hosting security check prevented the automatic "
            "review. The client should open the link manually and confirm the required feature."
        )
    if raw.startswith("HTTP ") or "HTTPS/TLS" in raw:
        if facts.get("passed"):
            return "The submitted website opened successfully and was available for manual review."
        return "The submitted website could not be fully checked automatically."
    if raw.startswith("Timeout"):
        return "The submitted website did not respond in time. The client should try opening the link manually."
    if "Security Blocked" in raw or "SSRF" in raw:
        return "The submitted link was blocked for safety and needs a different, publicly reviewable URL."
    return raw


def _detailed_review_explanation(
    llm_evaluation: Optional[Dict[str, Any]],
    facts: Dict[str, Any],
    client_evidence: str,
    fallback: str,
) -> str:
    """Keep useful findings when a result must remain human-reviewable."""
    explanation = str((llm_evaluation or {}).get("explanation") or "").strip()
    observations: List[str] = []

    observation = str(facts.get("observation") or "").strip()
    if observation:
        observations.append(observation)
    elements = facts.get("visual_elements") or facts.get("visual_elements_found") or []
    if isinstance(elements, list) and elements:
        observations.append("Visible elements included " + ", ".join(str(item) for item in elements[:8]) + ".")
    defects = facts.get("defects") or facts.get("defects_or_gaps") or []
    if isinstance(defects, list) and defects:
        observations.append("The check also noted: " + "; ".join(str(item) for item in defects[:8]) + ".")
    if client_evidence and client_evidence not in observations:
        observations.append(client_evidence)

    if not explanation:
        explanation = fallback
    if observations:
        details = " What was found: " + " ".join(observations)
        if details.lower() not in explanation.lower():
            explanation = explanation.rstrip(". ") + "." + details
    return explanation


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
    client_evidence = _client_facing_evidence(citation, adapter_facts)

    # Metadata-only probes establish availability, not semantic completion.
    # Keep these cases reviewable unless an adapter explicitly supplies bounded
    # content-level observations.
    if (
        adapter_passed
        and not adapter_facts.get("semantic_evidence", False)
        and adapter_name in {"github_api", "zip_listing", "http_probe"}
    ):
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.NEEDS_REVIEW,
            "passed": False,
            "score": 50,
            "confidence": 0.60,
            "explanation": _detailed_review_explanation(
                llm_evaluation,
                adapter_facts,
                client_evidence,
                "The submitted evidence was found, but the automatic check could not confirm "
                "that the work meets this requirement. Please review it before approving payment.",
            ),
            "evidence_match_snippet": client_evidence,
            "adapter_used": adapter_name,
            "requires_review": True,
        }

    # If the adapter explicitly flagged needs_review (e.g. rate limit, private repo, probe unreachable, non-GitHub host):
    if adapter_facts.get("needs_review"):
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.NEEDS_REVIEW,
            "passed": False,
            "score": 50,
            "confidence": 0.60,
            "explanation": _detailed_review_explanation(
                llm_evaluation,
                adapter_facts,
                client_evidence,
                "The automatic check could not fully confirm this requirement. "
                "Manual review is required before approving payment.",
            ),
            "evidence_match_snippet": client_evidence or "The submitted evidence needs human review.",
            "adapter_used": adapter_name,
            "requires_review": True,
        }

    # Hard failure: adapter failed without needs_review (e.g., 404 URL, corrupt ZIP, missing evidence)
    if not adapter_passed and adapter_error:
        # Rate-limiting / anti-bot challenges from edge CDNs are not a real failure.
        # Treat 429, 403 or "bot protection" messages as Needs Review, not hard fail.
        error_lower = (adapter_error or "").lower()
        is_rate_limit = any(k in error_lower for k in ["429", "403", "rate limit", "too many", "bot", "forbidden", "access denied"])
        if is_rate_limit:
            return {
                "criterion_id": criterion_id,
                "title": title,
                "status": CriterionStatus.NEEDS_REVIEW,
                "passed": False,
                "score": 65,
                "confidence": 0.60,
                "explanation": (
                    "The website is responding, but an automated security check prevented a full review. "
                    "Please open the link yourself and confirm that the required feature works."
                ),
                "evidence_match_snippet": client_evidence or "The submitted evidence needs human review.",
                "adapter_used": adapter_name,
                "requires_review": True,
            }
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.FAIL,
            "passed": False,
            "score": 0,
            "confidence": 0.95,
            "explanation": (
                "The submitted evidence did not show that this requirement was completed. "
                "Please correct the missing work and submit the evidence again."
            ),
            "evidence_match_snippet": client_evidence,
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
                "This requirement depends on human judgment about appearance or presentation. "
                "Please review it before approving payment."
            ),
            "evidence_match_snippet": client_evidence,
            "adapter_used": adapter_name,
            "requires_review": True,
        }

    # LLM evaluation integration (if available)
    if llm_evaluation:
        llm_passed = bool(llm_evaluation.get("passed", False))
        llm_score = int(llm_evaluation.get("score", 80 if llm_passed else 30))
        llm_conf = float(llm_evaluation.get("confidence", 0.85))
        llm_expl = str(llm_evaluation.get("explanation", ""))
        llm_snip = str(llm_evaluation.get("cited_snippet", client_evidence))

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
            is_review = (
                adapter_facts.get("needs_review", False)
                or llm_evaluation.get("needs_review", False)
                or llm_evaluation.get("requires_human_review", False)
                or llm_evaluation.get("requires_review", False)
                or (llm_score >= 50 and not adapter_error)
                or "review" in llm_expl.lower()
                or "unavailable" in llm_expl.lower()
                or "manual" in llm_expl.lower()
            )
            return {
                "criterion_id": criterion_id,
                "title": title,
                "status": CriterionStatus.NEEDS_REVIEW if is_review else CriterionStatus.FAIL,
                "passed": False,
                "score": llm_score,
                "confidence": llm_conf,
                "explanation": llm_expl or ("Manual review required." if is_review else "Deliverables did not satisfy criterion requirements."),
                "evidence_match_snippet": llm_snip,
                "adapter_used": adapter_name,
                "requires_review": is_review,
            }

    # Pure adapter evaluation (no AI evaluation available)
    # Adapter facts are EVIDENCE CONTEXT only — not criterion pass proof.
    # Without AI evaluation, we cannot automatically PASS any criterion.
    if adapter_passed:
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.NEEDS_REVIEW,
            "passed": False,
            "score": 50,
            "confidence": 0.60,
            "explanation": (
                "Some evidence was found, but the automatic reviewer was unavailable. "
                "Please review the submission manually before approving payment."
            ),
            "evidence_match_snippet": client_evidence,
            "adapter_used": adapter_name,
            "requires_review": True,
        }
    else:
        return {
            "criterion_id": criterion_id,
            "title": title,
            "status": CriterionStatus.FAIL,
            "passed": False,
            "score": 25,
            "confidence": 0.90,
            "explanation": (
                "The submitted evidence did not confirm that this requirement was completed."
            ),
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

    failed_titles = [
        c.get("title", "An acceptance requirement")
        for c in criterion_evaluations
        if c.get("status") == CriterionStatus.FAIL
    ]
    review_titles = [
        c.get("title", "An acceptance requirement")
        for c in criterion_evaluations
        if c.get("status") == CriterionStatus.NEEDS_REVIEW
    ]

    if overall_passed:
        summary_analysis = (
            f"The submitted work meets all {len(criterion_evaluations)} agreed requirements "
            f"and received a score of {overall_score} out of 100. "
            "The evidence supports the agreed scope and no required item was left unresolved. "
            "The client should complete the final review and may approve payment if the work also "
            "meets their expectations."
        )
    elif requires_human_review:
        summary_analysis = (
            f"The submitted work received a score of {overall_score} out of 100. "
            f"{len(review_titles)} requirement(s) still need a personal check by the client: "
            f"{', '.join(review_titles[:4]) or 'the items marked for review'}. "
            "The automatic checks found useful evidence but could not safely confirm everything. "
            "The freelancer should provide any missing proof, while the client should review the "
            "links or files before approving payment."
        )
    else:
        gap_text = ", ".join(failed_titles[:3]) or "one or more requirements"
        summary_analysis = (
            f"The submitted work received a score of {overall_score} out of 100 and "
            f"did not meet {len(failed_titles)} required item(s). "
            f"The main item(s) needing attention are: {gap_text}. "
            "Please request changes and review the new submission before approving payment."
        )

    return {
        "overall_score": overall_score,
        "passed": overall_passed,
        "requires_human_review": requires_human_review,
        "summary_analysis": summary_analysis,
        "model_used": model_used,
        "criterion_evaluations": criterion_evaluations,
    }
