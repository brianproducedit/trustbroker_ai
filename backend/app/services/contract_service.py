import hashlib
import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlmodel import Session, select, func
from app.models.contract import Contract, ContractStatus, ContractVisibility, ContractVersion
from app.models.milestone import Milestone, MilestoneStatus, AcceptanceCriterion, CriterionStatus, PaymentStatus
from app.models.acceptance import ContractAcceptance
from app.models.marketplace import Application, ApplicationStatus
from app.models.user import UserProfile
from app.schemas.contract import ContractCreateRequest, ContractUpdateRequest, ContractRead, MilestoneRead, AcceptanceCriterionRead, ContractAcceptanceRead
from app.services.audit_service import log_audit_event
from app.services.notification_service import queue_notification
from app.services.policy_engine import PolicyEngine


def compute_contract_hash(
    title: str,
    description: str,
    total_amount: Any,
    currency: str,
    milestones: list,
) -> str:
    """Compute a deterministic canonical SHA-256 fingerprint for a contract version."""
    if isinstance(total_amount, list) and not isinstance(milestones, list):
        total_amount, milestones = milestones, total_amount
    m_list = []
    for m in milestones:
        if hasattr(m, "title"):
            m_title = m.title
            m_amount = str(m.amount)
            m_deadline = str(m.deadline) if m.deadline else ""
            raw_criteria = getattr(m, "acceptance_criteria", []) or []
        elif isinstance(m, dict):
            m_title = m.get("title", "")
            m_amount = str(m.get("amount", "0.00"))
            m_deadline = str(m.get("deadline", ""))
            raw_criteria = m.get("acceptance_criteria") or m.get("criteria") or []
        else:
            m_title = str(m)
            m_amount = "0.00"
            m_deadline = ""
            raw_criteria = []

        crit_list = []
        for c in raw_criteria:
            if hasattr(c, "title"):
                crit_list.append(c.title)
            elif isinstance(c, dict):
                crit_list.append(c.get("title", ""))
            elif isinstance(c, str):
                crit_list.append(c)

        m_list.append({
            "title": m_title,
            "amount": m_amount,
            "deadline": m_deadline,
            "criteria": crit_list,
        })

    payload = {
        "title": (title or "").strip(),
        "description": (description or "").strip(),
        "total_amount": str(total_amount),
        "currency": (currency or "USD").upper(),
        "milestones": m_list,
    }
    canonical_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()


def generate_contract_code(session: Session) -> str:
    """Generate a sequential human-readable code: TB-YYYY-XXX."""
    year = datetime.now(timezone.utc).year
    prefix = f"TB-{year}-"
    count = session.exec(select(func.count(Contract.id))).one()
    sequence = count + 1
    return f"{prefix}{sequence:03d}"


def get_contract_full(session: Session, contract_id: uuid.UUID) -> ContractRead:
    """Load contract with its milestones, criteria and acceptance records."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract {contract_id} not found",
        )

    milestones_query = (
        select(Milestone)
        .where(Milestone.contract_id == contract_id)
        .order_by(Milestone.sort_order.asc(), Milestone.created_at.asc())
    )
    milestones = list(session.exec(milestones_query).all())

    milestone_reads: List[MilestoneRead] = []
    for m in milestones:
        criteria_query = (
            select(AcceptanceCriterion)
            .where(AcceptanceCriterion.milestone_id == m.id)
            .order_by(AcceptanceCriterion.created_at.asc())
        )
        criteria = list(session.exec(criteria_query).all())
        criteria_reads = [
            AcceptanceCriterionRead(
                id=c.id,
                milestone_id=c.milestone_id,
                title=c.title,
                description=c.description,
                evidence_type=c.evidence_type,
                status=c.status,
                ai_confidence=c.ai_confidence,
                evidence_match_snippet=c.evidence_match_snippet,
                feedback=c.feedback,
                created_at=c.created_at,
            )
            for c in criteria
        ]
        milestone_reads.append(
            MilestoneRead(
                id=m.id,
                contract_id=m.contract_id,
                title=m.title,
                description=m.description,
                amount=m.amount,
                currency=m.currency,
                deadline=m.deadline,
                status=m.status,
                sort_order=m.sort_order,
                payment_status=m.payment_status,
                created_at=m.created_at,
                updated_at=m.updated_at,
                acceptance_criteria=criteria_reads,
            )
        )

    acceptances_query = (
        select(ContractAcceptance)
        .where(ContractAcceptance.contract_id == contract_id)
        .order_by(ContractAcceptance.accepted_at.asc())
    )
    acceptances = list(session.exec(acceptances_query).all())
    acceptance_reads = [
        ContractAcceptanceRead(
            id=a.id,
            contract_id=a.contract_id,
            version_number=a.version_number,
            user_id=a.user_id,
            role=a.role,
            content_hash=a.content_hash,
            ip_address=a.ip_address,
            user_agent=a.user_agent,
            accepted_at=a.accepted_at,
        )
        for a in acceptances
    ]

    effective_hash = contract.content_hash
    if not effective_hash:
        effective_hash = compute_contract_hash(
            title=contract.title,
            description=contract.description,
            total_amount=contract.total_amount,
            currency=contract.currency,
            milestones=milestones,
        )

    client_profile = session.get(UserProfile, contract.client_id) if contract.client_id else None
    freelancer_profile = session.get(UserProfile, contract.freelancer_id) if contract.freelancer_id else None

    return ContractRead(
        id=contract.id,
        code=contract.code,
        title=contract.title,
        description=contract.description,
        category=contract.category,
        current_version=contract.current_version,
        status=contract.status,
        visibility=contract.visibility,
        required_skills=contract.required_skills or [],
        opens_at=contract.opens_at,
        total_amount=contract.total_amount,
        currency=contract.currency,
        staged_amount=contract.staged_amount,
        released_amount=contract.released_amount,
        content_hash=effective_hash,
        client_id=contract.client_id,
        freelancer_id=contract.freelancer_id,
        freelancer_email=contract.freelancer_email,
        created_at=contract.created_at,
        updated_at=contract.updated_at,
        milestones=milestone_reads,
        acceptances=acceptance_reads,
        client_name=client_profile.full_name if client_profile else None,
        client_organization=client_profile.organization if client_profile else None,
        freelancer_name=freelancer_profile.full_name if freelancer_profile else None,
        freelancer_organization=freelancer_profile.organization if freelancer_profile else None,
    )


def create_contract(
    session: Session,
    client: UserProfile,
    req: ContractCreateRequest,
) -> ContractRead:
    """Create a new contract draft with milestones and acceptance criteria."""
    code = generate_contract_code(session)
    total_amount = sum((m.amount for m in req.milestones), Decimal("0.00"))

    # Resolve freelancer if freelancer_id not given but email matches existing user
    freelancer_id = req.freelancer_id
    if not freelancer_id and req.freelancer_email:
        existing_freelancer = session.exec(
            select(UserProfile).where(UserProfile.email == req.freelancer_email)
        ).first()
        if existing_freelancer:
            freelancer_id = existing_freelancer.id

    initial_hash = compute_contract_hash(
        title=req.title,
        description=req.description,
        total_amount=total_amount,
        currency=req.currency,
        milestones=req.milestones,
    )

    contract = Contract(
        code=code,
        title=req.title,
        description=req.description,
        category=req.category,
        current_version=1,
        status=ContractStatus.DRAFT,
        visibility=ContractVisibility.PRIVATE_DRAFT.value,
        required_skills=req.required_skills or [],
        total_amount=total_amount,
        currency=req.currency,
        content_hash=initial_hash,
        client_id=client.id,
        freelancer_id=freelancer_id,
        freelancer_email=req.freelancer_email,
    )
    session.add(contract)
    session.flush()

    # Create initial version snapshot
    version = ContractVersion(
        contract_id=contract.id,
        version_number=1,
        title=req.title,
        description=req.description,
        content_hash=initial_hash,
        sow_content={
            "title": req.title,
            "description": req.description,
            "category": req.category,
            "total_amount": str(total_amount),
            "currency": req.currency,
            "milestones": [m.model_dump(mode="json") for m in req.milestones],
        },
        created_by=client.id,
    )
    session.add(version)

    # Create milestones and acceptance criteria
    for idx, m_data in enumerate(req.milestones):
        milestone = Milestone(
            contract_id=contract.id,
            title=m_data.title,
            description=m_data.description,
            amount=m_data.amount,
            currency=m_data.currency,
            deadline=m_data.deadline,
            status=MilestoneStatus.PENDING,
            sort_order=m_data.sort_order or idx,
            payment_status=PaymentStatus.NOT_STARTED,
        )
        session.add(milestone)
        session.flush()

        for c_data in m_data.acceptance_criteria:
            criterion = AcceptanceCriterion(
                milestone_id=milestone.id,
                title=c_data.title,
                description=c_data.description,
                evidence_type=c_data.evidence_type,
                status=CriterionStatus.PENDING,
            )
            session.add(criterion)

    session.commit()

    log_audit_event(
        session=session,
        action="contract_created",
        details=f"Contract '{contract.title}' ({contract.code}) created by {client.full_name or client.email}",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"total_amount": str(total_amount), "milestone_count": len(req.milestones)},
    )

    return get_contract_full(session, contract.id)


def list_user_contracts(
    session: Session,
    user: UserProfile,
    role: Optional[str] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[ContractRead], int]:
    """Retrieve paginated contracts accessible to the user."""
    query = select(Contract)

    # Role filter
    if role == "client":
        matching_client_ids = [user.id]
        if user.email:
            email_ids = list(session.exec(select(UserProfile.id).where(UserProfile.email == user.email)).all())
            matching_client_ids = list(set(matching_client_ids + email_ids))
        query = query.where(Contract.client_id.in_(matching_client_ids))
    elif role == "freelancer":
        matching_freelancer_ids = [user.id]
        if user.email:
            email_ids = list(session.exec(select(UserProfile.id).where(UserProfile.email == user.email)).all())
            matching_freelancer_ids = list(set(matching_freelancer_ids + email_ids))
        query = query.where(
            (Contract.freelancer_id.in_(matching_freelancer_ids)) | (Contract.freelancer_email == user.email)
        )
    else:
        matching_user_ids = [user.id]
        if user.email:
            email_ids = list(session.exec(select(UserProfile.id).where(UserProfile.email == user.email)).all())
            matching_user_ids = list(set(matching_user_ids + email_ids))
        query = query.where(
            (Contract.client_id.in_(matching_user_ids))
            | (Contract.freelancer_id.in_(matching_user_ids))
            | (Contract.freelancer_email == user.email)
        )

    if status_filter:
        try:
            stat_enum = ContractStatus(status_filter)
            query = query.where(Contract.status == stat_enum)
        except ValueError:
            pass

    total = len(list(session.exec(query).all()))
    query = query.order_by(Contract.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    contracts = list(session.exec(query).all())

    contract_reads = [get_contract_full(session, c.id) for c in contracts]
    return contract_reads, total


def update_contract(
    session: Session,
    contract_id: uuid.UUID,
    client: UserProfile,
    req: ContractUpdateRequest,
) -> ContractRead:
    """Update contract draft, incrementing its version number and snapshotting SOW."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.client_id != client.id:
        raise HTTPException(status_code=403, detail="Only the client can update this contract draft")
    if contract.status != ContractStatus.DRAFT:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot edit contract in '{contract.status.value}' status. Only draft contracts can be modified.",
        )

    if req.title is not None:
        contract.title = req.title
    if req.description is not None:
        contract.description = req.description
    if req.category is not None:
        contract.category = req.category
    if req.freelancer_email is not None:
        contract.freelancer_email = req.freelancer_email
    if req.required_skills is not None:
        contract.required_skills = req.required_skills

    contract.current_version += 1
    contract.updated_at = datetime.now(timezone.utc)

    # If milestones are provided, replace existing milestones
    if req.milestones is not None:
        # Delete old milestones and criteria
        old_milestones = list(session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all())
        for m in old_milestones:
            old_criteria = list(session.exec(select(AcceptanceCriterion).where(AcceptanceCriterion.milestone_id == m.id)).all())
            for c in old_criteria:
                session.delete(c)
            session.delete(m)

        total_amount = Decimal("0.00")
        for idx, m_data in enumerate(req.milestones):
            total_amount += m_data.amount
            milestone = Milestone(
                contract_id=contract.id,
                title=m_data.title,
                description=m_data.description,
                amount=m_data.amount,
                currency=m_data.currency,
                deadline=m_data.deadline,
                status=MilestoneStatus.PENDING,
                sort_order=m_data.sort_order or idx,
                payment_status=PaymentStatus.NOT_STARTED,
            )
            session.add(milestone)
            session.flush()

            for c_data in m_data.acceptance_criteria:
                criterion = AcceptanceCriterion(
                    milestone_id=milestone.id,
                    title=c_data.title,
                    description=c_data.description,
                    evidence_type=c_data.evidence_type,
                    status=CriterionStatus.PENDING,
                )
                session.add(criterion)

        contract.total_amount = total_amount

    contract_milestones = list(session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all())
    new_hash = compute_contract_hash(
        title=contract.title,
        description=contract.description,
        total_amount=contract.total_amount,
        currency=contract.currency,
        milestones=contract_milestones,
    )
    contract.content_hash = new_hash

    # Create new ContractVersion snapshot
    version = ContractVersion(
        contract_id=contract.id,
        version_number=contract.current_version,
        title=contract.title,
        description=contract.description,
        content_hash=new_hash,
        sow_content={
            "title": contract.title,
            "description": contract.description,
            "category": contract.category,
            "total_amount": str(contract.total_amount),
            "currency": contract.currency,
        },
        created_by=client.id,
    )
    session.add(version)
    session.commit()

    log_audit_event(
        session=session,
        action="contract_updated",
        details=f"Contract updated to version {contract.current_version} by {client.full_name or client.email}",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"version": contract.current_version},
    )

    return get_contract_full(session, contract.id)


def accept_contract(
    session: Session,
    contract_id: uuid.UUID,
    user: UserProfile,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> ContractRead:
    """Record contract acceptance for client or freelancer. If both accept, activate contract."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    is_client = contract.client_id == user.id
    is_freelancer = contract.freelancer_id == user.id or contract.freelancer_email == user.email

    # Ensure canonical content hash exists
    if not contract.content_hash:
        contract_milestones = list(session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all())
        contract.content_hash = compute_contract_hash(
            title=contract.title,
            description=contract.description,
            total_amount=contract.total_amount,
            currency=contract.currency,
            milestones=contract_milestones,
        )
        session.flush()

    # Idempotent: re-accepting an already-active contract you have signed is a no-op success.
    if contract.status == ContractStatus.ACTIVE:
        already_accepted = session.exec(
            select(ContractAcceptance).where(
                ContractAcceptance.contract_id == contract.id,
                ContractAcceptance.version_number == contract.current_version,
                ContractAcceptance.user_id == user.id,
            )
        ).first()
        if already_accepted:
            return get_contract_full(session, contract.id)

    policy = PolicyEngine.can_accept_contract(user, contract)
    if not policy.allowed:
        raise HTTPException(status_code=403, detail=policy.reason)
    if not (is_client or is_freelancer):
        raise HTTPException(status_code=403, detail="You are not a party to this contract.")

    role = "client" if is_client else "freelancer"

    # Link freelancer_id if user is accepting by email invitation
    if is_freelancer and not contract.freelancer_id:
        contract.freelancer_id = user.id

    # Check if already accepted this version
    existing_acceptance = session.exec(
        select(ContractAcceptance).where(
            ContractAcceptance.contract_id == contract.id,
            ContractAcceptance.version_number == contract.current_version,
            ContractAcceptance.user_id == user.id,
        )
    ).first()

    if not existing_acceptance:
        acceptance = ContractAcceptance(
            contract_id=contract.id,
            version_number=contract.current_version,
            user_id=user.id,
            role=role,
            content_hash=contract.content_hash,
            ip_address=client_ip,
            user_agent=user_agent,
        )
        session.add(acceptance)
        session.flush()

    # Check all acceptances for current version
    version_acceptances = list(
        session.exec(
            select(ContractAcceptance).where(
                ContractAcceptance.contract_id == contract.id,
                ContractAcceptance.version_number == contract.current_version,
            )
        ).all()
    )

    roles_accepted = {a.role for a in version_acceptances}

    if "client" in roles_accepted and "freelancer" in roles_accepted:
        # Both parties have accepted current version!
        contract.status = ContractStatus.ACTIVE
        # Set milestones to in_progress
        milestones = list(session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all())
        for m in milestones:
            if m.status == MilestoneStatus.PENDING:
                m.status = MilestoneStatus.IN_PROGRESS
        log_audit_event(
            session=session,
            action="contract_fully_accepted",
            details=f"Contract '{contract.title}' ({contract.code}) fully accepted by both parties with SHA-256 fingerprint {contract.content_hash[:12] if contract.content_hash else ''}. Status is now ACTIVE.",
            contract_id=contract.id,
            actor_id=user.id,
            actor_name=user.full_name or user.email,
            metadata={"version": contract.current_version, "content_hash": contract.content_hash, "ip_address": client_ip},
        )
    else:
        contract.status = ContractStatus.PENDING_ACCEPTANCE
        log_audit_event(
            session=session,
            action="contract_accepted",
            details=f"Contract '{contract.title}' accepted by {role} ({user.full_name or user.email}) with SHA-256 fingerprint {contract.content_hash[:12] if contract.content_hash else ''}. Awaiting other party.",
            contract_id=contract.id,
            actor_id=user.id,
            actor_name=user.full_name or user.email,
            metadata={"version": contract.current_version, "content_hash": contract.content_hash, "ip_address": client_ip},
        )

    session.commit()
    return get_contract_full(session, contract.id)


def decline_award(
    session: Session,
    contract_id: uuid.UUID,
    user: UserProfile,
    reason: Optional[str] = None,
) -> ContractRead:
    """Freelancer declines an award: release the contract back to the open marketplace."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    policy = PolicyEngine.can_decline_award(user, contract)
    if not policy.allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=policy.reason)

    client_id = contract.client_id

    # Remove this freelancer's pending acceptance for the current version.
    stale_acceptances = list(
        session.exec(
            select(ContractAcceptance).where(
                ContractAcceptance.contract_id == contract.id,
                ContractAcceptance.version_number == contract.current_version,
                ContractAcceptance.user_id == user.id,
            )
        ).all()
    )
    for acceptance in stale_acceptances:
        session.delete(acceptance)

    # Mark the awarded application as withdrawn so the client can re-award someone else.
    awarded_application = session.exec(
        select(Application).where(
            Application.contract_id == contract.id,
            Application.freelancer_id == user.id,
        )
    ).first()
    if awarded_application:
        awarded_application.status = ApplicationStatus.WITHDRAWN.value
        awarded_application.rejection_reason = (
            f"Freelancer declined the award. Reason: {reason}" if reason else "Freelancer declined the award."
        )
        awarded_application.updated_at = datetime.now(timezone.utc)
        session.add(awarded_application)

    # Return the contract to the marketplace so the client can award another applicant.
    contract.freelancer_id = None
    contract.freelancer_email = None
    contract.status = ContractStatus.OPEN
    contract.visibility = ContractVisibility.OPEN.value
    contract.updated_at = datetime.now(timezone.utc)
    session.add(contract)

    log_audit_event(
        session=session,
        action="award_declined",
        details=(
            f"{user.full_name or user.email} declined the award for '{contract.title}' ({contract.code}). "
            f"The listing is open again. Reason: {reason or 'No reason specified'}"
        ),
        contract_id=contract.id,
        actor_id=user.id,
        actor_name=user.full_name or user.email,
    )

    if client_id:
        queue_notification(
            session,
            user_id=client_id,
            type="award_declined",
            title="Freelancer declined the award",
            body=(
                f"{user.full_name or user.email} declined {contract.code}. "
                "The listing is open again so you can award another applicant."
            ),
            entity_type="contract",
            entity_id=contract.id,
        )

    session.commit()
    return get_contract_full(session, contract.id)


def cancel_contract(
    session: Session,
    contract_id: uuid.UUID,
    user: UserProfile,
    reason: Optional[str] = None,
) -> ContractRead:
    """Cancel a contract and record the cancellation in the audit trail."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract {contract_id} not found",
        )

    contract.status = ContractStatus.CANCELLED
    contract.updated_at = datetime.now(timezone.utc)
    session.add(contract)

    log_audit_event(
        session=session,
        action="contract_cancelled",
        details=f"Contract '{contract.title}' was cancelled by {user.full_name or user.email}. Reason: {reason or 'No reason specified'}",
        contract_id=contract.id,
        actor_id=user.id,
        actor_name=user.full_name or user.email,
    )

    session.commit()
    return get_contract_full(session, contract.id)



# ---------------------------------------------------------------------------
# CRUD — Delete Contract (draft only, no payment records)
# ---------------------------------------------------------------------------

def delete_contract(
    session: Session,
    contract_id: uuid.UUID,
    client: UserProfile,
) -> dict:
    """Permanently delete a DRAFT contract with no payment attempts.

    Active, completed, awarded, or cancelled contracts cannot be deleted —
    use cancel_contract() for those.  Financial records (payment_attempts,
    payouts) are immutable and block deletion if they exist.
    """
    from app.models.payment import PaymentAttempt

    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    if contract.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the contract client can delete this contract")
    if contract.status != ContractStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete a contract in '{contract.status.value}' status. Only draft contracts can be deleted. Use cancel to close active contracts.",
        )

    # Block deletion if any payment records exist — financial audit trail must be preserved
    payment_count = session.exec(
        select(func.count(PaymentAttempt.id)).where(PaymentAttempt.contract_id == contract_id)
    ).one()
    if payment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a contract that has existing payment records. Cancel it instead.",
        )

    # Delete child records in dependency order
    milestones = list(session.exec(select(Milestone).where(Milestone.contract_id == contract_id)).all())
    for m in milestones:
        criteria = list(session.exec(select(AcceptanceCriterion).where(AcceptanceCriterion.milestone_id == m.id)).all())
        for c in criteria:
            session.delete(c)
        session.delete(m)

    # Delete contract versions
    for cv in list(session.exec(select(ContractVersion).where(ContractVersion.contract_id == contract_id)).all()):
        session.delete(cv)

    session.delete(contract)
    session.commit()

    return {"deleted": True, "contract_id": str(contract_id)}


# ---------------------------------------------------------------------------
# CRUD — Milestone individual update & delete (draft + not_started only)
# ---------------------------------------------------------------------------

def _assert_draft_milestone(session: Session, contract_id: uuid.UUID, milestone_id: uuid.UUID, client: UserProfile):
    """Shared guard: contract must be DRAFT owned by client, milestone must be not_started."""
    from app.models.milestone import PaymentStatus as PS

    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    if contract.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the contract client can modify milestones")
    if contract.status != ContractStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot modify milestones on a contract in '{contract.status.value}' status. Only draft contracts can be edited.",
        )
    milestone = session.get(Milestone, milestone_id)
    if not milestone or milestone.contract_id != contract_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found on this contract")
    if milestone.payment_status not in (PS.NOT_STARTED, PS.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot modify milestone '{milestone.title}' — it already has payment activity (status: {milestone.payment_status.value}). Funded and staged milestones are locked.",
        )
    return contract, milestone


def update_milestone(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    client: UserProfile,
    req,
) -> "MilestoneRead":
    """Update a single milestone on a DRAFT contract with no payment activity."""
    from app.schemas.milestone import MilestoneRead, AcceptanceCriterionRead

    contract, milestone = _assert_draft_milestone(session, contract_id, milestone_id, client)

    if req.title is not None:
        milestone.title = req.title
    if req.description is not None:
        milestone.description = req.description
    if req.amount is not None:
        milestone.amount = req.amount
    if req.deadline is not None:
        milestone.deadline = req.deadline
    if req.sort_order is not None:
        milestone.sort_order = req.sort_order

    milestone.updated_at = datetime.now(timezone.utc)
    session.add(milestone)

    # Recalculate contract total_amount from all milestones
    all_milestones = list(session.exec(select(Milestone).where(Milestone.contract_id == contract_id)).all())
    contract.total_amount = sum((m.amount for m in all_milestones), Decimal("0.00"))
    contract.content_hash = compute_contract_hash(
        title=contract.title,
        description=contract.description,
        total_amount=contract.total_amount,
        currency=contract.currency,
        milestones=all_milestones,
    )
    contract.updated_at = datetime.now(timezone.utc)
    session.add(contract)
    session.commit()
    session.refresh(milestone)

    log_audit_event(
        session=session,
        action="milestone_updated",
        details=f"Milestone '{milestone.title}' updated by {client.full_name or client.email}",
        contract_id=contract_id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"milestone_id": str(milestone_id)},
    )

    criteria = list(session.exec(select(AcceptanceCriterion).where(AcceptanceCriterion.milestone_id == milestone.id).order_by(AcceptanceCriterion.created_at.asc())).all())
    criteria_reads = [
        AcceptanceCriterionRead(
            id=c.id, milestone_id=c.milestone_id, title=c.title, description=c.description,
            evidence_type=c.evidence_type, status=c.status, ai_confidence=c.ai_confidence,
            evidence_match_snippet=c.evidence_match_snippet, feedback=c.feedback, created_at=c.created_at,
        ) for c in criteria
    ]
    return MilestoneRead(
        id=milestone.id, contract_id=milestone.contract_id, title=milestone.title,
        description=milestone.description, amount=milestone.amount, currency=milestone.currency,
        deadline=milestone.deadline, status=milestone.status, sort_order=milestone.sort_order,
        payment_status=milestone.payment_status, created_at=milestone.created_at,
        updated_at=milestone.updated_at, acceptance_criteria=criteria_reads,
    )


def delete_milestone(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    client: UserProfile,
) -> dict:
    """Delete a single milestone from a DRAFT contract — only if no payment activity."""
    contract, milestone = _assert_draft_milestone(session, contract_id, milestone_id, client)

    # Remove acceptance criteria first
    for c in list(session.exec(select(AcceptanceCriterion).where(AcceptanceCriterion.milestone_id == milestone_id)).all()):
        session.delete(c)
    session.delete(milestone)

    # Recalculate contract totals
    remaining = list(session.exec(select(Milestone).where(Milestone.contract_id == contract_id)).all())
    contract.total_amount = sum((m.amount for m in remaining), Decimal("0.00"))
    contract.content_hash = compute_contract_hash(
        title=contract.title, description=contract.description,
        total_amount=contract.total_amount, currency=contract.currency, milestones=remaining,
    )
    contract.updated_at = datetime.now(timezone.utc)
    session.add(contract)
    session.commit()

    log_audit_event(
        session=session,
        action="milestone_deleted",
        details=f"Milestone '{milestone.title}' deleted by {client.full_name or client.email}",
        contract_id=contract_id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"milestone_id": str(milestone_id)},
    )

    return {"deleted": True, "milestone_id": str(milestone_id)}


# ---------------------------------------------------------------------------
# CRUD — Acceptance Criterion individual update & delete
# ---------------------------------------------------------------------------

def _assert_draft_criterion(session: Session, contract_id: uuid.UUID, milestone_id: uuid.UUID, criterion_id: uuid.UUID, client: UserProfile):
    """Shared guard for criterion operations — inherits all milestone guards."""
    contract, milestone = _assert_draft_milestone(session, contract_id, milestone_id, client)
    criterion = session.get(AcceptanceCriterion, criterion_id)
    if not criterion or criterion.milestone_id != milestone_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceptance criterion not found on this milestone")
    return contract, milestone, criterion


def update_criterion(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    criterion_id: uuid.UUID,
    client: UserProfile,
    req,
) -> "AcceptanceCriterionRead":
    """Update a single acceptance criterion on a draft contract milestone."""
    from app.schemas.milestone import AcceptanceCriterionRead

    _, _, criterion = _assert_draft_criterion(session, contract_id, milestone_id, criterion_id, client)

    if req.title is not None:
        criterion.title = req.title
    if req.description is not None:
        criterion.description = req.description
    if req.evidence_type is not None:
        criterion.evidence_type = req.evidence_type

    session.add(criterion)
    session.commit()
    session.refresh(criterion)

    log_audit_event(
        session=session,
        action="criterion_updated",
        details=f"Acceptance criterion '{criterion.title}' updated by {client.full_name or client.email}",
        contract_id=contract_id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"criterion_id": str(criterion_id)},
    )

    return AcceptanceCriterionRead(
        id=criterion.id, milestone_id=criterion.milestone_id, title=criterion.title,
        description=criterion.description, evidence_type=criterion.evidence_type,
        status=criterion.status, ai_confidence=criterion.ai_confidence,
        evidence_match_snippet=criterion.evidence_match_snippet, feedback=criterion.feedback,
        created_at=criterion.created_at,
    )


def delete_criterion(
    session: Session,
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    criterion_id: uuid.UUID,
    client: UserProfile,
) -> dict:
    """Delete a single acceptance criterion from a draft contract milestone."""
    _, _, criterion = _assert_draft_criterion(session, contract_id, milestone_id, criterion_id, client)

    log_audit_event(
        session=session,
        action="criterion_deleted",
        details=f"Acceptance criterion '{criterion.title}' deleted by {client.full_name or client.email}",
        contract_id=contract_id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"criterion_id": str(criterion_id)},
    )

    session.delete(criterion)
    session.commit()

    return {"deleted": True, "criterion_id": str(criterion_id)}
