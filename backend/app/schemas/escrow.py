from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class EscrowOrderCreate(BaseModel):
    task_id: str
    application_id: str

class EscrowVerifyRequest(BaseModel):
    task_id: str
    razorpay_order_id: str
    razorpay_payment_id: str

class EscrowReleaseRequest(BaseModel):
    task_id: str

class EscrowResponse(BaseModel):
    id: str
    task_id: str
    payer_id: str
    payee_id: str
    amount: float
    status: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime
    released_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
