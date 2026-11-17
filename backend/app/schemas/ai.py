from typing import Optional, List
from pydantic import BaseModel, Field

class MatchRequest(BaseModel):
    task_title: str
    task_description: str
    task_category: str
    student_skills: Optional[List[str]] = []
    student_bio: Optional[str] = ""
    student_college: Optional[str] = ""
    student_rating: Optional[float] = 5.0

class MatchResponse(BaseModel):
    compatibility_score: float = Field(ge=0.0, le=100.0)
    match_tier: str  # Excellent, Strong, Moderate, Low
    highlighted_keywords: List[str]
    confidence: float

class PriceEstimateRequest(BaseModel):
    category: str
    description: str
    distance_km: Optional[float] = 2.0
    estimated_hours: Optional[float] = 1.0

class PriceEstimateResponse(BaseModel):
    suggested_budget: float
    min_budget: float
    max_budget: float
    currency: str = "INR"
    explanation: str

class SafetyCheckRequest(BaseModel):
    text: str

class SafetyCheckResponse(BaseModel):
    is_safe: bool
    risk_level: str  # LOW, MEDIUM, HIGH
    flags: List[str]
