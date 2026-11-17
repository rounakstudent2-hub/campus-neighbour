from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

class TaskBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    category: str = Field(min_length=2, max_length=100)
    budget: float = Field(gt=0)
    lat: float = Field(ge=-90.0, le=90.0)
    lon: float = Field(ge=-180.0, le=180.0)
    address: str = Field(min_length=3, max_length=300)

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    budget: Optional[float] = None
    status: Optional[str] = None
    completion_notes: Optional[str] = None

class TaskCompletionRequest(BaseModel):
    completion_notes: str = Field(min_length=3)

class TaskResponse(TaskBase):
    id: str
    creator_id: str
    status: str
    assigned_to: Optional[str] = None
    completion_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    distance_km: Optional[float] = None
    creator: Optional[UserResponse] = None
    assigned_student: Optional[UserResponse] = None
    applications_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
