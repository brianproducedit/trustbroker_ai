import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select, func
from app.models.acceptance import ContractAcceptance
from app.models.contract import Contract, ContractStatus, ContractVisibility
from app.models.marketplace import (
    Application,
    ApplicationStatus,
    VettingRecommendation,
    VettingReport,
)
from app.models.milestone import Milestone, AcceptanceCriterion
from app.models.user import UserProfile
from app.schemas.marketplace import (
    ApplicantProfileSummary,
    ApplicationCreateRequest,
    ApplicationRead,
    ListingDetailRead,
    ListingRead,
    VettingReportRead,
)
from app.services.audit_service import log_audit_event
from app.services.contract_service import get_contract_full
from app.services.notification_service import queue_notification
from app.services.policy_engine import PolicyEngine, PolicyResult
from app.services.vetting_service import vet_application
from app.schemas.contract import ContractRead


def _raise_if_denied(result: PolicyResult) -> None:
    if not result.allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=result.reason)


def _sow_complete(session: Session, contract: Contract) -> None:
    if not (contract.title or "").strip():
        raise HTTPException(status_code=400, detail="A title is required before publishing.")
    milestones = list(session.exec(select(Milestone).where(Milestone.contract_id == contract.id)).all())
    if not milestones:
        raise HTTPException(status_code=400, detail="Publish requires at least one milestone.")
    total = sum((m.amount for m in milestones), Decimal("0.00"))
    if total != contract.total_amount:
        contract.total_amount = total
    if total <= 0:
        raise HTTPException(status_code=400, detail="Milestone amounts must sum to a positive total.")
    for m in milestones:
        criteria = list(
            session.exec(select(AcceptanceCriterion).where(AcceptanceCriterion.milestone_id == m.id)).all()
        )
        if not criteria:
            raise HTTPException(
                status_code=400,
                detail=f"Milestone '{m.title}' needs at least one acceptance criterion before publishing.",
            )


def _listing_from_contract(session: Session, contract: Contract) -> ListingRead:
    milestone_count = session.exec(
        select(func.count(Milestone.id)).where(Milestone.contract_id == contract.id)
    ).one()
    return ListingRead(
        id=contract.id,
        code=contract.code,
        title=contract.title,
        description=contract.description,
        category=contract.category,
        status=contract.status,
        visibility=contract.visibility,
        required_skills=contract.required_skills or [],
        total_amount=contract.total_amount,
        currency=contract.currency,
        client_id=contract.client_id,
        opens_at=contract.opens_at,
        created_at=contract.created_at,
        milestone_count=int(milestone_count),
    )


def _application_read(session: Session, application: Application, include_profile: bool) -> ApplicationRead:
    vetting = session.exec(
        select(VettingReport).where(VettingReport.application_id == application.id)
    ).first()
    freelancer_summary = None
    if include_profile:
        freelancer = session.get(UserProfile, application.freelancer_id)
        if freelancer:
            freelancer_summary = ApplicantProfileSummary(
                id=freelancer.id,
                full_name=freelancer.full_name,
                headline=freelancer.headline,
                skills=freelancer.skills or [],
                profile_completeness=freelancer.profile_completeness,
                paypal_payout_email=freelancer.paypal_payout_email,
            )
    contract = session.get(Contract, application.contract_id)
    return ApplicationRead(
        id=application.id,
        contract_id=application.contract_id,
        freelancer_id=application.freelancer_id,
        cover_note=application.cover_note,
        proposed_start=application.proposed_start,
        portfolio_snapshot=application.portfolio_snapshot or [],
        status=application.status,
        contract_title=contract.title if contract else None,
        contract_code=contract.code if contract else None,
        created_at=application.created_at,
        updated_at=application.updated_at,
        freelancer=freelancer_summary,
        vetting=VettingReportRead.model_validate(vetting) if vetting else None,
    )


def stub_vetting_report(session: Session, application: Application, freelancer: UserProfile) -> VettingReport:
    """Deterministic Phase 1 stub. Full AI ranking is Phase 3."""
    completeness = freelancer.profile_completeness or 0
    has_portfolio = bool(freelancer.portfolio)
    has_skills = bool(freelancer.skills)
    score = 40
    if completeness:
        score += min(30, completeness // 3)
    if has_portfolio:
        score += 20
    if has_skills:
        score += 10
    score = min(100, score)
    if completeness < 40 and has_portfolio:
        recommendation = VettingRecommendation.NEW_TALENT.value
        reasons = {
            "newcomer": True,
            "note": "Limited TrustBroker history; portfolio and skills were weighted instead of completed jobs.",
            "profile_completeness": completeness,
        }
    elif score >= 80:
        recommendation = VettingRecommendation.STRONG_FIT.value
        reasons = {"profile_completeness": completeness, "portfolio": has_portfolio}
    elif score >= 60:
        recommendation = VettingRecommendation.GOOD_FIT.value
        reasons = {"profile_completeness": completeness, "portfolio": has_portfolio}
    else:
        recommendation = VettingRecommendation.WEAK_FIT.value
        reasons = {"profile_completeness": completeness, "portfolio": has_portfolio}

    report = VettingReport(
        application_id=application.id,
        score=score,
        recommendation=recommendation,
        reasons=reasons,
        model_used="stub",
    )
    session.add(report)
    return report


def publish_contract(session: Session, contract_id: uuid.UUID, client: UserProfile) -> ContractRead:
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    _raise_if_denied(PolicyEngine.can_publish(client, contract))
    _sow_complete(session, contract)

    now = datetime.now(timezone.utc)
    contract.status = ContractStatus.OPEN
    contract.visibility = ContractVisibility.OPEN.value
    contract.opens_at = now
    contract.updated_at = now
    session.add(contract)
    session.commit()

    log_audit_event(
        session=session,
        action="contract_published",
        details=f"Contract '{contract.title}' ({contract.code}) published as an open listing.",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
    )
    return get_contract_full(session, contract.id)


def list_open_listings(
    session: Session,
    category: Optional[str] = None,
    min_budget: Optional[Decimal] = None,
    max_budget: Optional[Decimal] = None,
    skill: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[ListingRead], int]:
    filters = [
        Contract.status == ContractStatus.OPEN,
        Contract.visibility == ContractVisibility.OPEN.value,
    ]
    if category:
        filters.append(Contract.category == category.lower())
    if min_budget is not None:
        filters.append(Contract.total_amount >= min_budget)
    if max_budget is not None:
        filters.append(Contract.total_amount <= max_budget)

    stmt = select(Contract).where(*filters).order_by(Contract.opens_at.desc(), Contract.created_at.desc())
    contracts = list(session.exec(stmt).all())

    if skill:
        needle = skill.strip().lower()
        contracts = [
            c
            for c in contracts
            if needle in [s.lower() for s in (c.required_skills or [])]
            or needle in (c.title or "").lower()
            or needle in (c.description or "").lower()
            or needle in (c.category or "").lower()
        ]

    total = len(contracts)
    start = (page - 1) * per_page
    page_rows = contracts[start : start + per_page]
    return [_listing_from_contract(session, c) for c in page_rows], total


def apply_to_contract(
    session: Session,
    contract_id: uuid.UUID,
    freelancer: UserProfile,
    req: ApplicationCreateRequest,
) -> ApplicationRead:
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    _raise_if_denied(PolicyEngine.can_apply(freelancer, contract))

    existing = session.exec(
        select(Application).where(
            Application.contract_id == contract.id,
            Application.freelancer_id == freelancer.id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this contract.",
        )

    application = Application(
        contract_id=contract.id,
        freelancer_id=freelancer.id,
        cover_note=req.cover_note or "",
        proposed_start=req.proposed_start,
        portfolio_snapshot=req.portfolio_snapshot or [],
        status=ApplicationStatus.SUBMITTED.value,
    )
    session.add(application)
    try:
        session.flush()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this contract.",
        )

    vet_application(session, application, freelancer, contract)
    application.status = ApplicationStatus.RANKED.value
    application.updated_at = datetime.now(timezone.utc)

    queue_notification(
        session,
        user_id=contract.client_id,
        type="application_received",
        title="New application",
        body=f"{freelancer.full_name or freelancer.email} applied to {contract.code}.",
        entity_type="application",
        entity_id=application.id,
    )
    session.commit()
    session.refresh(application)

    log_audit_event(
        session=session,
        action="application_submitted",
        details=f"{freelancer.full_name or freelancer.email} applied to {contract.code}.",
        contract_id=contract.id,
        actor_id=freelancer.id,
        actor_name=freelancer.full_name or freelancer.email,
        metadata={"application_id": str(application.id)},
    )
    return _application_read(session, application, include_profile=False)


def list_contract_applications(
    session: Session,
    contract_id: uuid.UUID,
    client: UserProfile,
) -> Tuple[List[ApplicationRead], int]:
    contract = session.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.client_id != client.id:
        raise HTTPException(status_code=403, detail="Only the client can view applications for this contract.")

    applications = list(
        session.exec(
            select(Application)
            .where(Application.contract_id == contract.id)
        ).all()
    )
    reads = [_application_read(session, a, include_profile=True) for a in applications]
    reads.sort(key=lambda a: (a.vetting.score if a.vetting else -1), reverse=True)
    return reads, len(reads)


def award_application(
    session: Session,
    application_id: uuid.UUID,
    client: UserProfile,
) -> ContractRead:
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    contract = session.get(Contract, application.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    freelancer = session.get(UserProfile, application.freelancer_id)
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer profile not found")

    _raise_if_denied(PolicyEngine.can_award(client, contract, application, freelancer))

    now = datetime.now(timezone.utc)
    application.status = ApplicationStatus.AWARDED.value
    application.updated_at = now

    others = list(
        session.exec(
            select(Application).where(
                Application.contract_id == contract.id,
                Application.id != application.id,
            )
        ).all()
    )
    for other in others:
        if other.status not in (ApplicationStatus.WITHDRAWN.value, ApplicationStatus.AWARDED.value):
            other.status = ApplicationStatus.REJECTED.value
            other.updated_at = now
            queue_notification(
                session,
                user_id=other.freelancer_id,
                type="application_rejected",
                title="Application not selected",
                body=f"The client awarded {contract.code} to another freelancer.",
                entity_type="contract",
                entity_id=contract.id,
            )

    contract.freelancer_id = freelancer.id
    contract.freelancer_email = freelancer.email
    contract.status = ContractStatus.PENDING_ACCEPTANCE
    contract.visibility = ContractVisibility.CLOSED.value
    contract.updated_at = now
    session.add(contract)

    existing_client_acceptance = session.exec(
        select(ContractAcceptance).where(
            ContractAcceptance.contract_id == contract.id,
            ContractAcceptance.version_number == contract.current_version,
            ContractAcceptance.user_id == client.id,
        )
    ).first()
    if not existing_client_acceptance:
        session.add(
            ContractAcceptance(
                contract_id=contract.id,
                version_number=contract.current_version,
                user_id=client.id,
                role="client",
            )
        )

    queue_notification(
        session,
        user_id=freelancer.id,
        type="application_awarded",
        title="You were awarded a contract",
        body=f"{client.full_name or client.email} awarded you {contract.code}. Accept the terms to activate it.",
        entity_type="contract",
        entity_id=contract.id,
    )
    session.commit()

    log_audit_event(
        session=session,
        action="contract_awarded",
        details=f"Client awarded {contract.code} to {freelancer.full_name or freelancer.email}.",
        contract_id=contract.id,
        actor_id=client.id,
        actor_name=client.full_name or client.email,
        metadata={"application_id": str(application.id), "freelancer_id": str(freelancer.id)},
    )
    return get_contract_full(session, contract.id)


def get_open_listing(session: Session, listing_id: uuid.UUID, user: UserProfile) -> ListingDetailRead:
    contract = session.get(Contract, listing_id)
    if not contract or contract.visibility != ContractVisibility.OPEN.value or contract.status != ContractStatus.OPEN:
        raise HTTPException(status_code=404, detail="Open listing not found")
    base = _listing_from_contract(session, contract)
    full = get_contract_full(session, contract.id)
    already = session.exec(
        select(Application).where(
            Application.contract_id == contract.id,
            Application.freelancer_id == user.id,
        )
    ).first()
    return ListingDetailRead(
        **base.model_dump(),
        milestones=[m.model_dump(mode="json") for m in full.milestones],
        already_applied=already is not None,
    )


def list_my_applications(session: Session, freelancer: UserProfile) -> Tuple[List[ApplicationRead], int]:
    applications = list(
        session.exec(
            select(Application)
            .where(Application.freelancer_id == freelancer.id)
            .order_by(Application.created_at.desc())
        ).all()
    )
    return [_application_read(session, a, include_profile=False) for a in applications], len(applications)


def shortlist_application(
    session: Session,
    application_id: uuid.UUID,
    client: UserProfile,
) -> ApplicationRead:
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    contract = session.get(Contract, application.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.client_id != client.id:
        raise HTTPException(status_code=403, detail="Only the client can shortlist applicants.")
    if application.status not in (ApplicationStatus.RANKED.value, ApplicationStatus.SUBMITTED.value, ApplicationStatus.SHORTLISTED.value):
        raise HTTPException(status_code=409, detail=f"Cannot shortlist an application in '{application.status}' status.")
    application.status = ApplicationStatus.SHORTLISTED.value
    application.updated_at = datetime.now(timezone.utc)
    queue_notification(
        session,
        user_id=application.freelancer_id,
        type="application_shortlisted",
        title="You were shortlisted",
        body=f"The client shortlisted you for {contract.code}.",
        entity_type="contract",
        entity_id=contract.id,
    )
    session.commit()
    return _application_read(session, application, include_profile=True)


def rerun_vetting(session: Session, application_id: uuid.UUID, user: UserProfile) -> ApplicationRead:
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    contract = session.get(Contract, application.contract_id)
    freelancer = session.get(UserProfile, application.freelancer_id)
    if not contract or not freelancer:
        raise HTTPException(status_code=404, detail="Application parties not found")
    if user.id not in (contract.client_id, application.freelancer_id):
        raise HTTPException(status_code=403, detail="Only the client or applicant can refresh vetting.")
    vet_application(session, application, freelancer, contract)
    application.status = ApplicationStatus.RANKED.value
    application.updated_at = datetime.now(timezone.utc)
    session.commit()
    return _application_read(session, application, include_profile=True)
