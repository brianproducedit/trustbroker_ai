import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.contract import ContractStatus


class ListingRead(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    description: str
    category: str
    status: ContractStatus
    visibility: str
    required_skills: List[str] = []
    total_amount: Decimal
    currency: str
    client_id: uuid.UUID
    opens_at: Optional[datetime] = None
    created_at: datetime
    milestone_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ListingListResponse(BaseModel):
    listings: List[ListingRead]
    total: int


class ListingDetailRead(ListingRead):
    milestones: List[Dict[str, Any]] = []
    already_applied: bool = False


class ApplicationCreateRequest(BaseModel):
    cover_note: str = Field(default="", max_length=4000)
    proposed_start: Optional[str] = None
    portfolio_snapshot: List[Dict[str, Any]] = []


class ApplicantProfileSummary(BaseModel):
    id: uuid.UUID
    full_name: str
    headline: Optional[str] = None
    skills: List[str] = []
    profile_completeness: int = 0
    paypal_payout_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VettingReportRead(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    score: int
    recommendation: str
    reasons: Dict[str, Any] = {}
    model_used: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationRead(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    freelancer_id: uuid.UUID
    cover_note: str
    proposed_start: Optional[str] = None
    portfolio_snapshot: List[Dict[str, Any]] = []
    status: str
    contract_title: Optional[str] = None
    contract_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    freelancer: Optional[ApplicantProfileSummary] = None
    vetting: Optional[VettingReportRead] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationListResponse(BaseModel):
    applications: List[ApplicationRead]
    total: int


class NotificationRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    body: str
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    notifications: List[NotificationRead]
    unread_count: int
    total: int
