import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.milestone import MilestoneStatus, PaymentStatus, CriterionStatus


class AcceptanceCriterionCreate(BaseModel):
    title: str
    description: str = ""
    evidence_type: str = "text"  # text, file, url, screenshot


class AcceptanceCriterionRead(BaseModel):
    id: uuid.UUID
    milestone_id: uuid.UUID
    title: str
    description: str
    evidence_type: str
    status: CriterionStatus
    ai_confidence: Optional[float] = None
    evidence_match_snippet: Optional[str] = None
    feedback: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MilestoneUpdateRequest(BaseModel):
    """Partial update for a single milestone on a draft contract."""
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    deadline: Optional[str] = None
    sort_order: Optional[int] = None


class CriterionUpdateRequest(BaseModel):
    """Partial update for a single acceptance criterion on a draft contract milestone."""
    title: Optional[str] = None
    description: Optional[str] = None
    evidence_type: Optional[str] = None  # text, file, url, screenshot


class MilestoneCreate(BaseModel):
    title: str
    description: str = ""
    amount: Decimal
    currency: str = "USD"
    deadline: Optional[str] = None
    sort_order: int = 0
    acceptance_criteria: List[AcceptanceCriterionCreate] = []


class MilestoneRead(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    title: str
    description: str
    amount: Decimal
    currency: str
    deadline: Optional[str] = None
    status: MilestoneStatus
    sort_order: int
    payment_status: PaymentStatus
    created_at: datetime
    updated_at: datetime
    acceptance_criteria: List[AcceptanceCriterionRead] = []

    model_config = ConfigDict(from_attributes=True)


class MilestoneUpdateRequest(BaseModel):
    """Partial update for a single milestone on a draft contract."""
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    deadline: Optional[str] = None
    sort_order: Optional[int] = None


class CriterionUpdateRequest(BaseModel):
    """Partial update for a single acceptance criterion on a draft contract milestone."""
    title: Optional[str] = None
    description: Optional[str] = None
    evidence_type: Optional[str] = None  # text, file, url, screenshot
