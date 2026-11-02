import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ContractAcceptance(SQLModel, table=True):
    __tablename__ = "contract_acceptances"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    contract_id: uuid.UUID = Field(foreign_key="contracts.id", index=True, nullable=False)
    version_number: int = Field(nullable=False)
    user_id: uuid.UUID = Field(foreign_key="profiles.id", index=True, nullable=False)
    role: str = Field(nullable=False)  # "client" or "freelancer"
    content_hash: Optional[str] = Field(default=None, max_length=64, nullable=True)
    ip_address: Optional[str] = Field(default=None, max_length=64, nullable=True)
    user_agent: Optional[str] = Field(default=None, max_length=512, nullable=True)
    accepted_at: datetime = Field(default_factory=utc_now, nullable=False)
