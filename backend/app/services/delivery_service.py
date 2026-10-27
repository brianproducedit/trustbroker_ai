import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlmodel import Session, select, func
from app.models.contract import Contract
from app.models.milestone import Milestone, MilestoneStatus
from app.models.delivery import Delivery, DeliveryFile
from app.models.user import UserProfile
from app.schemas.delivery import DeliveryCreateRequest, DeliveryRead, DeliveryFileRead
from app.services.audit_service import log_audit_event
from app.services.verification_service import orchestrate_delivery_verification
from app.services.verification.safety import validate_evidence_file, sanitize_filename
from app.services.policy_engine import PolicyEngine
from app.utils.security import require_contract_party


def get_delivery_full(session: Session, delivery_id: uuid.UUID) -> DeliveryRead:
    """Load delivery with its attached files."""
    delivery = session.get(Delivery, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    files = list(
        session.exec(select(DeliveryFile).where(DeliveryFile.delivery_id == delivery.id)).all()
    )
    files_read = [
        DeliveryFileRead(
            id=f.id,
            delivery_id=f.delivery_id,
            file_name=f.file_name,
            storage_path=f.storage_path,
            size_bytes=f.size_bytes,
            mime_type=f.mime_type,
            uploaded_at=f.uploaded_at,
        )
        for f in files
    ]

    return DeliveryRead(
        id=delivery.id,
        contract_id=delivery.contract_id,
        milestone_id=delivery.milestone_id,
        submitted_by=delivery.submitted_by,
        description=delivery.description,
        repo_url=delivery.repo_url,
        live_url=delivery.live_url,
        version=delivery.version,
        submitted_at=delivery.submitted_at,
        files=files_read,
    )


def submit_delivery(
    session: Session,
    freelancer: UserProfile,
    req: DeliveryCreateRequest,
) -> Dict[str, Any]:
    """Submit milestone evidence and optionally run automated AI verification."""
    contract = session.get(Contract, req.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Verify caller is the freelancer or email match
    is_freelancer = contract.freelancer_id == freelancer.id or contract.freelancer_email == freelancer.email
    if not is_freelancer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned freelancer can submit deliveries for this contract.",
        )

    milestone = session.get(Milestone, req.milestone_id)
    if not milestone or milestone.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="Milestone not found for this contract")

    policy = PolicyEngine.can_submit_delivery(freelancer, contract, milestone)
    if not policy.allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=policy.reason)

    # Determine delivery version for this milestone
    current_count = session.exec(
        select(func.count(Delivery.id)).where(Delivery.milestone_id == milestone.id)
    ).one()
    version = current_count + 1

    delivery = Delivery(
        contract_id=contract.id,
        milestone_id=milestone.id,
        submitted_by=freelancer.id,
        description=req.description,
        repo_url=req.repo_url,
        live_url=req.live_url,
        version=version,
    )
    session.add(delivery)
    session.flush()

    # Add attached files
    files_to_process = req.files or req.file_attachments or []
    for f_data in files_to_process:
        is_safe, reason = validate_evidence_file(f_data.file_name, f_data.size_bytes, f_data.mime_type)
        if not is_safe:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File rejection: {reason}")

        safe_name = sanitize_filename(f_data.file_name)
        d_file = DeliveryFile(
            delivery_id=delivery.id,
            file_name=safe_name,
            storage_path=f_data.storage_path,
            size_bytes=f_data.size_bytes,
            mime_type=f_data.mime_type,
        )
        session.add(d_file)

    milestone.status = MilestoneStatus.SUBMITTED
    session.commit()

    log_audit_event(
        session=session,
        action="delivery_submitted",
        details=f"Delivery version {version} submitted for milestone '{milestone.title}' by {freelancer.full_name or freelancer.email}.",
        contract_id=contract.id,
        actor_id=freelancer.id,
        actor_name=freelancer.full_name or freelancer.email,
        metadata={"delivery_id": str(delivery.id), "version": version},
    )

    delivery_read = get_delivery_full(session, delivery.id)

    # Auto-trigger AI verification if requested
    verification_result = None
    if req.auto_verify:
        try:
            verification_result = orchestrate_delivery_verification(
                session=session,
                contract_id=contract.id,
                milestone_id=milestone.id,
                delivery_id=delivery.id,
                actor=freelancer,
            )
        except Exception as e:
            print(f"Warning: Auto-verification error: {e}")
            verification_result = {"status": "error", "message": str(e)}

    return {
        "delivery": delivery_read,
        "verification": verification_result,
    }


def list_milestone_deliveries(
    session: Session,
    milestone_id: uuid.UUID,
    user: UserProfile,
) -> List[DeliveryRead]:
    """Retrieve all chronological delivery attempts for a milestone."""
    milestone = session.get(Milestone, milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    contract = session.get(Contract, milestone.contract_id)
    require_contract_party(user, contract)

    deliveries = list(
        session.exec(
            select(Delivery)
            .where(Delivery.milestone_id == milestone_id)
            .order_by(Delivery.submitted_at.desc())
        ).all()
    )

    return [get_delivery_full(session, d.id) for d in deliveries]


def request_revision(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    client: UserProfile,
    notes: str = "",
) -> Dict[str, Any]:
    """Request revisions on a milestone delivery from the client."""
    from app.services.policy_engine import PolicyEngine

    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="Milestone not found for this contract")

    policy = PolicyEngine.can_request_revision(client, contract, milestone)
    if not policy:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=policy.reason)

    milestone.status = MilestoneStatus.REVISION_REQUESTED
    session.add(milestone)
    session.commit()

    log_audit_event(
        session=session,
        action="revision_requested",
        details=f"Revision requested for milestone '{milestone.title}' by {client.full_name or client.email}. Notes: {notes or 'No additional notes provided.'}",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"milestone_id": str(milestone.id), "notes": notes},
    )

    return {
        "status": "revision_requested",
        "milestone_id": str(milestone.id),
        "milestone_status": milestone.status.value,
        "notes": notes,
    }


def override_review(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    client: UserProfile,
    reason: str,
) -> Dict[str, Any]:
    """Client approves milestone delivery via human review override (Roadmap §7.2 / Phase 5)."""
    from app.models.milestone import PaymentStatus
    from app.services.notification_service import queue_notification

    clean_reason = (reason or "").strip()
    if not clean_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A justification reason is required for human review approval.",
        )

    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the client can perform human review override on this contract.",
        )

    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.contract_id != contract.id:
        raise HTTPException(status_code=404, detail="Milestone not found for this contract")

    milestone.status = MilestoneStatus.VERIFIED
    if milestone.payment_status == PaymentStatus.STAGED_IN_SANDBOX:
        milestone.payment_status = PaymentStatus.RELEASE_AUTHORIZED

    session.add(milestone)
    session.commit()

    log_audit_event(
        session=session,
        action="human_review",
        details=f"Client approved milestone '{milestone.title}' via human review override. Reason: {clean_reason}",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"milestone_id": str(milestone.id), "reason": clean_reason},
    )

    if contract.freelancer_id:
        queue_notification(
            session=session,
            user_id=contract.freelancer_id,
            type="verification",
            title="Milestone Approved by Client",
            body=f"Client approved milestone '{milestone.title}' via manual review override.",
            entity_type="contract",
            entity_id=contract.id,
        )

    return {
        "status": "verified",
        "milestone_id": str(milestone.id),
        "milestone_status": milestone.status.value,
        "payment_status": milestone.payment_status.value,
        "reason": clean_reason,
    }
