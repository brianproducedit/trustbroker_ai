import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProfileRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    organization: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    portfolio: List[Dict[str, Any]] = []
    paypal_payout_email: Optional[str] = None
    primary_workspace: str = "client"
    profile_completeness: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=200)
    organization: Optional[str] = Field(default=None, max_length=200)
    headline: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = Field(default=None, max_length=4000)
    skills: Optional[List[str]] = None
    portfolio: Optional[List[Dict[str, Any]]] = None
    paypal_payout_email: Optional[str] = Field(default=None, max_length=254)
    primary_workspace: Optional[str] = None
