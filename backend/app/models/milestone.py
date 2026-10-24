import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    VERIFYING = "verifying"
    VERIFIED = "verified"
    SETTLED = "settled"
    REVISION_REQUESTED = "revision_requested"


class PaymentStatus(str, Enum):
    NOT_STARTED = "not_started"
    CHECKOUT_CREATED = "checkout_created"
    STAGED_IN_SANDBOX = "staged_in_sandbox"
    RELEASE_AUTHORIZED = "release_authorized"
    RELEASED = "released"
    CANCELLED = "cancelled"


class CriterionStatus(str, Enum):
    PENDING = "pending"
    PASS = "pass"
    FAIL = "fail"
    NEEDS_REVIEW = "needs_review"


class Milestone(SQLModel, table=True):
    __tablename__ = "milestones"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    contract_id: uuid.UUID = Field(foreign_key="contracts.id", index=True, nullable=False)
    title: str = Field(nullable=False)
    description: str = Field(default="", nullable=False)
    amount: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2, nullable=False)
    currency: str = Field(default="USD", nullable=False)
    deadline: Optional[str] = Field(default=None, nullable=True)
    status: MilestoneStatus = Field(default=MilestoneStatus.PENDING, nullable=False)
    sort_order: int = Field(default=0, nullable=False)
    payment_status: PaymentStatus = Field(default=PaymentStatus.NOT_STARTED, nullable=False)

    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)


class AcceptanceCriterion(SQLModel, table=True):
    __tablename__ = "acceptance_criteria"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    milestone_id: uuid.UUID = Field(foreign_key="milestones.id", index=True, nullable=False)
    title: str = Field(nullable=False)
    description: str = Field(default="", nullable=False)
    evidence_type: str = Field(default="text", nullable=False)  # text, file, url, screenshot
    status: CriterionStatus = Field(default=CriterionStatus.PENDING, nullable=False)
    ai_confidence: Optional[float] = Field(default=None, nullable=True)
    evidence_match_snippet: Optional[str] = Field(default=None, nullable=True)
    feedback: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
