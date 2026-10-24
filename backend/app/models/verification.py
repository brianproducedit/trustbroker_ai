import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class VerificationReport(SQLModel, table=True):
    __tablename__ = "verification_reports"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    delivery_id: uuid.UUID = Field(foreign_key="deliveries.id", index=True, nullable=False)
    contract_id: uuid.UUID = Field(foreign_key="contracts.id", index=True, nullable=False)
    milestone_id: uuid.UUID = Field(foreign_key="milestones.id", index=True, nullable=False)
    overall_score: int = Field(default=0, nullable=False)  # 0 to 100
    passed: bool = Field(default=False, nullable=False)
    summary_analysis: str = Field(default="", nullable=False)
    model_used: str = Field(default="gemini-2.5-flash", nullable=False)
    requires_human_review: bool = Field(default=False, nullable=False)
    assessed_at: datetime = Field(default_factory=utc_now, nullable=False)


class CriterionResult(SQLModel, table=True):
    __tablename__ = "criterion_results"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    report_id: uuid.UUID = Field(foreign_key="verification_reports.id", index=True, nullable=False)
    criterion_id: uuid.UUID = Field(foreign_key="acceptance_criteria.id", index=True, nullable=False)
    passed: bool = Field(default=False, nullable=False)
    score: int = Field(default=0, nullable=False)  # 0 to 100
    explanation: str = Field(default="", nullable=False)
    assessed_at: datetime = Field(default_factory=utc_now, nullable=False)
