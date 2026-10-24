import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SOWDraftRequest(BaseModel):
    prompt: str = Field(..., description="Description of the project scope and deliverables")
    category: str = Field("software", description="Category: software, design, marketing, research")
    total_budget: float = Field(1000.0, gt=0, description="Total budget across all milestones")
    currency: str = Field("USD", description="Currency code (USD, EUR, etc.)")


class SOWDraftResponse(BaseModel):
    title: str
    description: str
    category: str
    total_budget: float
    currency: str
    milestones: List[Dict[str, Any]]


class DeliveryVerificationRequest(BaseModel):
    contract_id: uuid.UUID
    milestone_id: uuid.UUID
    delivery_id: uuid.UUID
