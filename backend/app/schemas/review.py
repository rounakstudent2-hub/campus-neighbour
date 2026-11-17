from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse

class ReviewCreate(BaseModel):
    task_id: str
    reviewee_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3)

class ReviewResponse(BaseModel):
    id: str
    task_id: str
    reviewer_id: str
    reviewee_id: str
    rating: int
    comment: str
    created_at: datetime
    reviewer: Optional[UserResponse] = None

    class Config:
        from_attributes = True
