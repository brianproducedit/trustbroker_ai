import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlmodel import Session, select, func
from app.models.contract import Contract, ContractStatus, ContractVersion
from app.models.milestone import Milestone, MilestoneStatus, AcceptanceCriterion, CriterionStatus, PaymentStatus
from app.models.acceptance import ContractAcceptance
from app.models.user import UserProfile
from app.schemas.contract import ContractCreateRequest, ContractUpdateRequest, ContractRead, MilestoneRead, AcceptanceCriterionRead, ContractAcceptanceRead
from app.services.audit_service import log_audit_event


def generate_contract_code(session: Session) -> str:
    """Generate a sequential human-readable code: TB-YYYY-XXX."""
    year = datetime.now(timezone.utc).year
    prefix = f"TB-{year}-"
    count = session.exec(select(func.count(Contract.id))).one()
    sequence = count + 1
    return f"{prefix}{sequence:03d}"


def get_contract_full(session: Session, contract_id: uuid.UUID) -> ContractRead:
    """Load contract with its milestones, criteria, and acceptance records."""
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
            accepted_at=a.accepted_at,
        )
        for a in acceptances
    ]

    return ContractRead(
        id=contract.id,
        code=contract.code,
        title=contract.title,
        description=contract.description,
        category=contract.category,
        current_version=contract.current_version,
        status=contract.status,
        total_amount=contract.total_amount,
        currency=contract.currency,
        staged_amount=contract.staged_amount,
        released_amount=contract.released_amount,
        client_id=contract.client_id,
        freelancer_id=contract.freelancer_id,
        freelancer_email=contract.freelancer_email,
        created_at=contract.created_at,
        updated_at=contract.updated_at,
        milestones=milestone_reads,
        acceptances=acceptance_reads,
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

    contract = Contract(
        code=code,
        title=req.title,
        description=req.description,
        category=req.category,
        current_version=1,
        status=ContractStatus.DRAFT,
        total_amount=total_amount,
        currency=req.currency,
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
        query = query.where(Contract.client_id == user.id)
    elif role == "freelancer":
        query = query.where(
            (Contract.freelancer_id == user.id) | (Contract.freelancer_email == user.email)
        )
    else:
        query = query.where(
            (Contract.client_id == user.id)
            | (Contract.freelancer_id == user.id)
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

    # Create new ContractVersion snapshot
    version = ContractVersion(
        contract_id=contract.id,
        version_number=contract.current_version,
        title=contract.title,
        description=contract.description,
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
) -> ContractRead:
    """Record contract acceptance for client or freelancer. If both accept, activate contract."""
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    is_client = contract.client_id == user.id
    is_freelancer = contract.freelancer_id == user.id or contract.freelancer_email == user.email

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
            details=f"Contract '{contract.title}' ({contract.code}) fully accepted by both parties. Status is now ACTIVE.",
            contract_id=contract.id,
            actor_id=user.id,
            actor_name=user.full_name or user.email,
        )
    else:
        contract.status = ContractStatus.PENDING_ACCEPTANCE
        log_audit_event(
            session=session,
            action="contract_accepted",
            details=f"Contract '{contract.title}' accepted by {role} ({user.full_name or user.email}). Awaiting other party.",
            contract_id=contract.id,
            actor_id=user.id,
            actor_name=user.full_name or user.email,
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

