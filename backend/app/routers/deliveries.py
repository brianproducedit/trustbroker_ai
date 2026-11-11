import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, BackgroundTasks, Body, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from app.config import settings
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract
from app.models.delivery import Delivery, DeliveryFile
from app.models.milestone import AcceptanceCriterion, Milestone, MilestoneStatus
from app.models.verification import VerificationReport, CriterionResult
from app.schemas.delivery import DeliveryCreateRequest, DeliveryRead, RevisionRequest, OverrideReviewRequest
from app.services import delivery_service, verification_service
from app.utils.security import get_current_user, require_contract_party
from app.utils.supabase_client import get_supabase_admin, get_signed_download_url

logger = logging.getLogger("trustbroker.deliveries")

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])

# Directory for uploaded delivery evidence files (private, not publicly accessible)
_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "evidence")
os.makedirs(_UPLOAD_DIR, exist_ok=True)

_ALLOWED_MIME_TYPES = {
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "application/pdf", "application/zip",
    "text/plain", "text/markdown",
}
_MAX_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


def _has_expected_file_signature(content_type: str, contents: bytes) -> bool:
    signatures = {
        "application/pdf": contents.startswith(b"%PDF-"),
        "application/zip": contents.startswith(b"PK\x03\x04"),
        "image/png": contents.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/jpeg": contents.startswith(b"\xff\xd8\xff"),
        "image/gif": contents.startswith((b"GIF87a", b"GIF89a")),
        "image/webp": contents.startswith(b"RIFF") and contents[8:12] == b"WEBP",
    }
    return signatures.get(content_type, True)


@router.post("/upload-file", summary="Upload a delivery evidence file")
async def upload_evidence_file(
    file: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_user),
):
    """Accept a multipart file upload for delivery evidence.

    Returns a server-side storage_path that should be passed in the
    ``files`` array when submitting delivery evidence (POST /deliveries).
    This replaces client-side blob: URLs which are not accessible server-side.
    """
    if file.content_type not in _ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' is not allowed. Permitted: {', '.join(sorted(_ALLOWED_MIME_TYPES))}",
        )

    contents = bytearray()
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        contents.extend(chunk)
        if len(contents) > _MAX_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds the 25 MB limit.")
    contents = bytes(contents)
    if len(contents) > _MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 25 MB limit.")
    if not _has_expected_file_signature(file.content_type or "", contents):
        raise HTTPException(
            status_code=400,
            detail="File content does not match the declared MIME type.",
        )

    safe_name = "".join(c if c.isalnum() or c in "-_." else "_" for c in (file.filename or "file"))
    file_id = uuid.uuid4()

    # Attempt private Supabase Storage upload if configured
    supabase_client = get_supabase_admin()
    if supabase_client:
        try:
            bucket_name = "delivery-evidence"
            sub_path = f"{str(current_user.id)}/{file_id}_{safe_name}"
            res = supabase_client.storage.from_(bucket_name).upload(
                sub_path,
                contents,
                file_options={"content-type": file.content_type or "application/octet-stream"},
            )
            return {
                "file_name": file.filename,
                "storage_path": f"supabase://{bucket_name}/{sub_path}",
                "size_bytes": len(contents),
                "mime_type": file.content_type or "application/octet-stream",
            }
        except Exception as sup_err:
            if settings.environment.lower() == "production":
                logger.error(f"[STORAGE] Production Supabase storage upload failed: {sup_err}")
                raise HTTPException(
                    status_code=503,
                    detail="Evidence storage service unavailable. Please retry shortly.",
                )
            # In development/test, fallback to local disk storage
            logger.warning(f"[STORAGE] Supabase upload failed ({sup_err}); falling back to local disk in {settings.environment}")

    if settings.environment.lower() == "production" and not supabase_client:
        logger.error("[STORAGE] Production requires Supabase storage configuration (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)")
        raise HTTPException(
            status_code=503,
            detail="Cloud evidence storage is not configured on this production environment.",
        )

    # Local disk fallback (allowed in development and test environments)
    relative_path = f"{str(current_user.id)}/{file_id}_{safe_name}"
    dest_dir = os.path.join(_UPLOAD_DIR, str(current_user.id))
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, f"{file_id}_{safe_name}")

    with open(dest_path, "wb") as fh:
        fh.write(contents)

    return {
        "file_name": file.filename,
        "storage_path": f"uploads/evidence/{relative_path}",
        "size_bytes": len(contents),
        "mime_type": file.content_type or "application/octet-stream",
    }


@router.get("/files/{file_id}/download", summary="Download delivery evidence file")
def download_evidence_file(
    file_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Download delivery evidence file with party authorization check."""
    d_file = session.get(DeliveryFile, file_id)
    if not d_file:
        raise HTTPException(status_code=404, detail="File not found")
    delivery = session.get(Delivery, d_file.delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    contract = session.get(Contract, delivery.contract_id)
    require_contract_party(current_user, contract)

    # Supabase signed download
    if d_file.storage_path.startswith("supabase://"):
        parts = d_file.storage_path.replace("supabase://", "").split("/", 1)
        if len(parts) == 2:
            bucket, s_path = parts
            url = get_signed_download_url(bucket, s_path)
            if url:
                return {"download_url": url}

    # Local file download: canonicalize path and ensure it stays inside _UPLOAD_DIR
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_abs = os.path.realpath(os.path.join(backend_root, d_file.storage_path))
    evidence_root = os.path.realpath(_UPLOAD_DIR)

    # Must stay inside evidence_root and actually exist
    if target_abs.startswith(evidence_root) and os.path.isfile(target_abs):
        return FileResponse(target_abs, media_type=d_file.mime_type, filename=d_file.file_name)

    raise HTTPException(status_code=404, detail="File content not found on server")



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
            "estimated_seconds": 45,
            "maximum_seconds": 420,
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
        if delivery.verification_cancelled:
            return {
                "delivery_id": str(delivery.id),
                "status": "cancelled",
                "milestone_status": milestone.status.value if milestone else None,
                "report": None,
            }
        now = datetime.now(timezone.utc)
        sub_time = delivery.submitted_at
        if sub_time.tzinfo is None:
            sub_time = sub_time.replace(tzinfo=timezone.utc)
        age_seconds = (now - sub_time).total_seconds()

        # If milestone is actively in VERIFYING state:
        if milestone and milestone.status == MilestoneStatus.VERIFYING:
            if age_seconds > 420:
                # Allow the configured provider retry window plus network/model
                # calls before declaring a background task interrupted.
                return {
                    "delivery_id": str(delivery.id),
                    "status": "interrupted",
                    "milestone_status": milestone.status.value,
                    "error": "Verification process timed out or was interrupted by a service restart. Manual client review required.",
                    "report": None,
                }

            return {
                "delivery_id": str(delivery.id),
                "status": "verifying",
                "milestone_status": milestone.status.value,
                "estimated_seconds": 45,
                "maximum_seconds": 420,
                "report": None,
            }

        # If milestone is in SUBMITTED state (queued or reverted due to engine error):
        if milestone and milestone.status == MilestoneStatus.SUBMITTED:
            if age_seconds > 45:
                # Background task either never started, crashed or was interrupted
                return {
                    "delivery_id": str(delivery.id),
                    "status": "needs_review",
                    "milestone_status": milestone.status.value,
                    "error": "Automated verification could not complete; deliverable is queued for human review.",
                    "report": None,
                }
            return {
                "delivery_id": str(delivery.id),
                "status": "queued",
                "milestone_status": milestone.status.value,
                "report": None,
            }

        return {
            "delivery_id": str(delivery.id),
            "status": "pending",
            "milestone_status": milestone.status.value if milestone else None,
            "report": None,
        }

    criterion_rows = session.exec(
        select(
            CriterionResult,
            AcceptanceCriterion.title,
            AcceptanceCriterion.status,
            AcceptanceCriterion.evidence_match_snippet,
        )
        .join(AcceptanceCriterion, AcceptanceCriterion.id == CriterionResult.criterion_id)
        .where(CriterionResult.report_id == report.id)
    ).all()

    criterion_evaluations = [
        {
            "criterion_id": str(cr.criterion_id),
            "title": title or "Verified criterion",
            "status": criterion_status.value if hasattr(criterion_status, "value") else criterion_status,
            "passed": cr.passed,
            "score": cr.score,
            "explanation": cr.explanation,
            "evidence_match_snippet": evidence_match_snippet or "",
        }
        for cr, title, criterion_status, evidence_match_snippet in criterion_rows
    ]

    terminal_status = "needs_review" if report.requires_human_review else ("completed" if report.passed else "failed")

    return {
        "delivery_id": str(delivery.id),
        "status": terminal_status,
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


@router.post("/{delivery_id}/cancel-verification", summary="Cancel a running AI verification")
def cancel_delivery_verification(
    delivery_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Request cancellation of a background verification without creating a report."""
    delivery = session.get(Delivery, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    contract = session.get(Contract, delivery.contract_id)
    require_contract_party(current_user, contract)
    milestone = session.get(Milestone, delivery.milestone_id)

    if session.exec(
        select(VerificationReport).where(VerificationReport.delivery_id == delivery.id)
    ).first():
        raise HTTPException(status_code=409, detail="Verification has already completed")

    delivery.verification_cancelled = True
    delivery.verification_cancelled_at = datetime.now(timezone.utc)
    if milestone and milestone.status == MilestoneStatus.VERIFYING:
        milestone.status = MilestoneStatus.SUBMITTED
        session.add(milestone)
    session.add(delivery)
    session.commit()
    return {
        "delivery_id": str(delivery.id),
        "status": "cancelled",
        "message": "Verification stopped. No AI assessment was created.",
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
    req: RevisionRequest = Body(default_factory=RevisionRequest),
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
