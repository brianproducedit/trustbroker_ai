import uuid
from datetime import datetime, timezone
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
    accepted_at: datetime = Field(default_factory=utc_now, nullable=False)
