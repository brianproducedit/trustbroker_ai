import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditEvent(SQLModel, table=True):
    __tablename__ = "audit_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    contract_id: Optional[uuid.UUID] = Field(default=None, foreign_key="contracts.id", index=True, nullable=True)
    actor_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id", index=True, nullable=True)
    actor_name: str = Field(default="System", nullable=False)
    action: str = Field(nullable=False)  # contract_created, payment_staged, etc.
    details: str = Field(default="", nullable=False)
    metadata_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON, nullable=True))
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
