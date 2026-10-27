import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from sqlalchemy import JSON, Column, UniqueConstraint
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    RANKED = "ranked"
    SHORTLISTED = "shortlisted"
    AWARDED = "awarded"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class VettingRecommendation(str, Enum):
    STRONG_FIT = "strong_fit"
    GOOD_FIT = "good_fit"
    POSSIBLE_FIT = "possible_fit"
    NEW_TALENT = "new_talent"
    WEAK_FIT = "weak_fit"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


class PayoutStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    UNCLAIMED = "unclaimed"
    FAILED = "failed"
    RETURNED = "returned"


class Application(SQLModel, table=True):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("contract_id", "freelancer_id", name="uq_applications_contract_freelancer"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    contract_id: uuid.UUID = Field(foreign_key="contracts.id", index=True, nullable=False)
    freelancer_id: uuid.UUID = Field(foreign_key="profiles.id", index=True, nullable=False)
    cover_note: str = Field(default="", nullable=False)
    proposed_start: Optional[str] = Field(default=None, nullable=True)
    portfolio_snapshot: List[Dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False, server_default="[]"),
    )
    status: str = Field(default=ApplicationStatus.SUBMITTED.value, index=True, nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)


class VettingReport(SQLModel, table=True):
    __tablename__ = "vetting_reports"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    application_id: uuid.UUID = Field(foreign_key="applications.id", unique=True, index=True, nullable=False)
    score: int = Field(default=0, nullable=False)
    recommendation: str = Field(default=VettingRecommendation.NEW_TALENT.value, nullable=False)
    reasons: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    model_used: str = Field(default="stub", nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: uuid.UUID = Field(foreign_key="profiles.id", index=True, nullable=False)
    type: str = Field(index=True, nullable=False)
    title: str = Field(nullable=False)
    body: str = Field(default="", nullable=False)
    entity_type: Optional[str] = Field(default=None, nullable=True)
    entity_id: Optional[uuid.UUID] = Field(default=None, nullable=True)
    read_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)


class Payout(SQLModel, table=True):
    __tablename__ = "payouts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    contract_id: uuid.UUID = Field(foreign_key="contracts.id", index=True, nullable=False)
    milestone_id: uuid.UUID = Field(foreign_key="milestones.id", index=True, nullable=False)
    freelancer_id: uuid.UUID = Field(foreign_key="profiles.id", index=True, nullable=False)
    amount: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2, nullable=False)
    currency: str = Field(default="USD", nullable=False)
    paypal_batch_id: Optional[str] = Field(default=None, index=True, nullable=True)
    paypal_item_id: Optional[str] = Field(default=None, index=True, nullable=True)
    paypal_payout_email: Optional[str] = Field(default=None, nullable=True)
    status: str = Field(default=PayoutStatus.PENDING.value, index=True, nullable=False)
    idempotency_key: str = Field(unique=True, index=True, nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)
