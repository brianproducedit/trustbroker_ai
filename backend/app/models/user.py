import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserProfile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(index=True, unique=True, nullable=False)
    full_name: str = Field(default="", nullable=False)
    organization: Optional[str] = Field(default=None, nullable=True)
    headline: Optional[str] = Field(default=None, nullable=True)
    bio: Optional[str] = Field(default=None, nullable=True)
    skills: List[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False, server_default="[]"))
    portfolio: List[Dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False, server_default="[]"),
    )
    paypal_payout_email: Optional[str] = Field(default=None, nullable=True)
    primary_workspace: str = Field(default="client", nullable=False)
    profile_completeness: int = Field(default=0, nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)
