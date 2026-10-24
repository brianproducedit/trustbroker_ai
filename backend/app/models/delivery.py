import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Delivery(SQLModel, table=True):
    __tablename__ = "deliveries"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    contract_id: uuid.UUID = Field(foreign_key="contracts.id", index=True, nullable=False)
    milestone_id: uuid.UUID = Field(foreign_key="milestones.id", index=True, nullable=False)
    submitted_by: uuid.UUID = Field(foreign_key="profiles.id", index=True, nullable=False)
    description: str = Field(default="", nullable=False)
    repo_url: Optional[str] = Field(default=None, nullable=True)
    live_url: Optional[str] = Field(default=None, nullable=True)
    version: int = Field(default=1, nullable=False)
    submitted_at: datetime = Field(default_factory=utc_now, nullable=False)


class DeliveryFile(SQLModel, table=True):
    __tablename__ = "delivery_files"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    delivery_id: uuid.UUID = Field(foreign_key="deliveries.id", index=True, nullable=False)
    file_name: str = Field(nullable=False)
    storage_path: str = Field(nullable=False)  # Supabase Storage path
    size_bytes: int = Field(default=0, nullable=False)
    mime_type: str = Field(default="application/octet-stream", nullable=False)
    uploaded_at: datetime = Field(default_factory=utc_now, nullable=False)
