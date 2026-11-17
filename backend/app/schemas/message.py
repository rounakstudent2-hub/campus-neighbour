from datetime import datetime
from pydantic import BaseModel, Field

class MessageCreate(BaseModel):
    task_id: str
    recipient_id: str
    text: str = Field(min_length=1)

class MessageResponse(BaseModel):
    id: str
    task_id: str
    sender_id: str
    recipient_id: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True
