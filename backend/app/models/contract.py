import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ContractStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    AWARDED = "awarded"
    PENDING_ACCEPTANCE = "pending_acceptance"
    ACTIVE = "active"
    IN_VERIFICATION = "in_verification"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ContractVisibility(str, Enum):
    PRIVATE_DRAFT = "private_draft"
    OPEN = "open"
    CLOSED = "closed"


class Contract(SQLModel, table=True):
    __tablename__ = "contracts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    code: str = Field(index=True, unique=True, nullable=False)
    title: str = Field(nullable=False)
    description: str = Field(default="", nullable=False)
    category: str = Field(default="software", nullable=False)
    current_version: int = Field(default=1, nullable=False)
    status: ContractStatus = Field(default=ContractStatus.DRAFT, nullable=False)
    visibility: str = Field(default=ContractVisibility.PRIVATE_DRAFT.value, index=True, nullable=False)
    required_skills: List[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False, server_default="[]"))
    opens_at: Optional[datetime] = Field(default=None, nullable=True)
    total_amount: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2, nullable=False)
    currency: str = Field(default="USD", nullable=False)
    staged_amount: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2, nullable=False)
    released_amount: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2, nullable=False)

    client_id: uuid.UUID = Field(foreign_key="profiles.id", index=True, nullable=False)
    freelancer_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id", index=True, nullable=True)
    freelancer_email: Optional[str] = Field(default=None, nullable=True)

    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)


class ContractVersion(SQLModel, table=True):
    __tablename__ = "contract_versions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    contract_id: uuid.UUID = Field(foreign_key="contracts.id", index=True, nullable=False)
    version_number: int = Field(nullable=False)
    title: str = Field(nullable=False)
    description: str = Field(default="", nullable=False)
    sow_content: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id", nullable=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
