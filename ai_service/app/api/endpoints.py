from typing import Optional, List
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.models.matchmaker import matchmaker_model
from app.models.price_recommender import price_recommender_model
from app.models.safety_classifier import safety_classifier_model

router = APIRouter(prefix="/api/v1", tags=["AI Inference"])

class MatchInput(BaseModel):
    task_title: str
    task_description: str
    task_category: str
    student_skills: Optional[List[str]] = []
    student_bio: Optional[str] = ""
    student_college: Optional[str] = ""
    student_rating: Optional[float] = 5.0

class PriceInput(BaseModel):
    category: str
    description: str
    distance_km: Optional[float] = 2.0
    estimated_hours: Optional[float] = 1.0

class SafetyInput(BaseModel):
    text: str

@router.post("/match")
def predict_match(data: MatchInput):
    return matchmaker_model.compute_compatibility(
        task_title=data.task_title,
        task_desc=data.task_description,
        category=data.task_category,
        skills=data.student_skills or [],
        bio=data.student_bio or "",
        college=data.student_college or "",
        rating=data.student_rating or 5.0
    )

@router.post("/price-estimate")
def predict_price(data: PriceInput):
    return price_recommender_model.estimate_price(
        category=data.category,
        description=data.description,
        distance_km=data.distance_km or 2.0,
        estimated_hours=data.estimated_hours or 1.0
    )

@router.post("/safety-check")
def check_safety(data: SafetyInput):
    return safety_classifier_model.evaluate(data.text)
