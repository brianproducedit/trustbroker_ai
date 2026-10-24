import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel
from app.models.milestone import PaymentStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PaymentAttempt(SQLModel, table=True):
    __tablename__ = "payment_attempts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    contract_id: uuid.UUID = Field(foreign_key="contracts.id", index=True, nullable=False)
    milestone_id: Optional[uuid.UUID] = Field(default=None, foreign_key="milestones.id", index=True, nullable=True)
    paypal_order_id: Optional[str] = Field(default=None, index=True, nullable=True)
    paypal_capture_id: Optional[str] = Field(default=None, index=True, nullable=True)
    amount: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2, nullable=False)
    currency: str = Field(default="USD", nullable=False)
    status: PaymentStatus = Field(default=PaymentStatus.NOT_STARTED, nullable=False)
    paypal_status: Optional[str] = Field(default=None, nullable=True)
    payer_email: Optional[str] = Field(default=None, nullable=True)

    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)


class ProviderEvent(SQLModel, table=True):
    __tablename__ = "provider_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    event_id: str = Field(unique=True, index=True, nullable=False)  # PayPal webhook event ID for idempotency
    event_type: str = Field(nullable=False)
    resource_id: Optional[str] = Field(default=None, index=True, nullable=True)
    payload: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    processed: bool = Field(default=False, nullable=False)
    processed_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
