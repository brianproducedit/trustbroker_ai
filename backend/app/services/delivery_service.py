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
    for f_data in req.files:
        d_file = DeliveryFile(
            delivery_id=delivery.id,
            file_name=f_data.file_name,
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
