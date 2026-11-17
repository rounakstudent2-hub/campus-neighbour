from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

class ApplicationBase(BaseModel):
    task_id: str
    proposed_fee: float = Field(gt=0)
    pitch: str = Field(min_length=10)

class ApplicationCreate(ApplicationBase):
    pass

class HireRequest(BaseModel):
    application_id: str

class ApplicationResponse(ApplicationBase):
    id: str
    student_id: str
    status: str
    created_at: datetime
    student: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
