from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user, require_roles
from app.services.application_service import application_service
from app.schemas.application import ApplicationCreate, ApplicationResponse, HireRequest
from app.models.user import User

router = APIRouter(prefix="/applications", tags=["Applications & Bids"])

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_task(
    app_in: ApplicationCreate,
    current_user: User = Depends(require_roles(["student", "admin"])),
    db: Session = Depends(get_db)
):
    return application_service.apply_to_task(db, current_user, app_in)

@router.get("/task/{task_id}", response_model=List[ApplicationResponse])
def get_task_applications(task_id: str, db: Session = Depends(get_db)):
    return application_service.list_task_applications(db, task_id)

@router.post("/{application_id}/hire", response_model=ApplicationResponse)
def hire_applicant(
    application_id: str,
    current_user: User = Depends(require_roles(["neighbor", "admin"])),
    db: Session = Depends(get_db)
):
    return application_service.hire_applicant(db, current_user, application_id)
