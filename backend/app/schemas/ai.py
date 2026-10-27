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


class ClarifyRequest(BaseModel):
    prompt: str = Field(..., description="Client brief in plain language")
    category: str = Field("software", description="software, design, marketing, or research")
    total_budget: float = Field(1000.0, gt=0)
    answers: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Optional prior Q&A as {question, answer} pairs",
    )


class ClarifyQuestion(BaseModel):
    id: str
    question: str


class ClarifyResponse(BaseModel):
    questions: List[ClarifyQuestion]
    provider_used: str = "stub"


class VetApplicationRequest(BaseModel):
    application_id: uuid.UUID


class DeliveryVerificationRequest(BaseModel):
    contract_id: uuid.UUID
    milestone_id: uuid.UUID
    delivery_id: uuid.UUID
