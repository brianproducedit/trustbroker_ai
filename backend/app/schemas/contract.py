import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.contract import ContractStatus
from app.schemas.milestone import MilestoneCreate, MilestoneRead, AcceptanceCriterionRead, AcceptanceCriterionCreate



class ContractCreateRequest(BaseModel):
    title: str
    description: str = ""
    category: str = "software"
    freelancer_email: Optional[str] = None
    freelancer_id: Optional[uuid.UUID] = None
    currency: str = "USD"
    milestones: List[MilestoneCreate] = []


class ContractUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    freelancer_email: Optional[str] = None
    freelancer_id: Optional[uuid.UUID] = None
    milestones: Optional[List[MilestoneCreate]] = None


class ContractAcceptanceRead(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    version_number: int
    user_id: uuid.UUID
    role: str
    accepted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContractRead(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    description: str
    category: str
    current_version: int
    status: ContractStatus
    total_amount: Decimal
    currency: str
    staged_amount: Decimal
    released_amount: Decimal
    client_id: uuid.UUID
    freelancer_id: Optional[uuid.UUID] = None
    freelancer_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    milestones: List[MilestoneRead] = []
    acceptances: List[ContractAcceptanceRead] = []

    model_config = ConfigDict(from_attributes=True)


class ContractListResponse(BaseModel):
    contracts: List[ContractRead]
    total: int
