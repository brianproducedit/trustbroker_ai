import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.milestone import PaymentStatus


class CreateOrderRequest(BaseModel):
    contract_id: uuid.UUID
    milestone_id: Optional[uuid.UUID] = None


class CaptureOrderRequest(BaseModel):
    paypal_order_id: str


class ReleasePayoutRequest(BaseModel):
    contract_id: uuid.UUID
    milestone_id: uuid.UUID


class PayoutRead(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    milestone_id: uuid.UUID
    freelancer_id: uuid.UUID
    amount: Decimal
    currency: str
    paypal_batch_id: Optional[str] = None
    paypal_item_id: Optional[str] = None
    paypal_payout_email: Optional[str] = None
    status: str
    idempotency_key: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentAttemptRead(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    milestone_id: Optional[uuid.UUID] = None
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    amount: Decimal
    currency: str
    status: PaymentStatus
    paypal_status: Optional[str] = None
    payer_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
