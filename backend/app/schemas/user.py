from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=100)
    role: str = Field(default="neighbor", pattern="^(neighbor|student|admin)$")
    college: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    college: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    id: Optional[str] = None
    role: Optional[str] = None
