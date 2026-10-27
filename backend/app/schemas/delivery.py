import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class DeliveryFileCreate(BaseModel):
    file_name: str
    storage_path: str
    size_bytes: int = 0
    mime_type: str = "application/octet-stream"


class DeliveryFileRead(BaseModel):
    id: uuid.UUID
    delivery_id: uuid.UUID
    file_name: str
    storage_path: str
    size_bytes: int
    mime_type: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeliveryCreateRequest(BaseModel):
    contract_id: uuid.UUID
    milestone_id: uuid.UUID
    description: str
    repo_url: Optional[str] = None
    live_url: Optional[str] = None
    files: List[DeliveryFileCreate] = []
    file_attachments: Optional[List[DeliveryFileCreate]] = None
    auto_verify: bool = True  # Automatically run AI verification upon submission


class DeliveryRead(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    milestone_id: uuid.UUID
    submitted_by: uuid.UUID
    description: str
    repo_url: Optional[str] = None
    live_url: Optional[str] = None
    version: int
    submitted_at: datetime
    files: List[DeliveryFileRead] = []

    model_config = ConfigDict(from_attributes=True)


class RevisionRequest(BaseModel):
    notes: str = ""


class OverrideReviewRequest(BaseModel):
    reason: str
