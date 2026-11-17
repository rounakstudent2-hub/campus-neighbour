from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.review import Review
from app.models.task import Task
from app.schemas.review import ReviewCreate, ReviewResponse
from app.models.user import User

router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == review_in.task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    if current_user.id != task.creator_id and current_user.id != task.assigned_to and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only review tasks you participated in.")

    review = Review(
        task_id=review_in.task_id,
        reviewer_id=current_user.id,
        reviewee_id=review_in.reviewee_id,
        rating=review_in.rating,
        comment=review_in.comment.strip()
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@router.get("/user/{user_id}", response_model=dict)
def get_user_reviews(user_id: str, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.reviewee_id == user_id).order_by(Review.created_at.desc()).all()
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.reviewee_id == user_id).scalar()
    
    return {
        "user_id": user_id,
        "total_reviews": len(reviews),
        "average_rating": round(float(avg_rating or 5.0), 1),
        "reviews": [ReviewResponse.model_validate(r) for r in reviews]
    }
