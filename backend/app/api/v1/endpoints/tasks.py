from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user, require_roles
from app.services.task_service import task_service
from app.schemas.task import TaskCreate, TaskResponse, TaskCompletionRequest
from app.models.user import User

router = APIRouter(prefix="/tasks", tags=["Tasks & Chores"])

@router.get("", response_model=List[TaskResponse])
def list_tasks(
    category: Optional[str] = None,
    status: Optional[str] = "open",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius: Optional[float] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return task_service.list_tasks(
        db,
        category=category,
        status_filter=status,
        user_lat=lat,
        user_lon=lon,
        radius_km=radius,
        skip=skip,
        limit=limit
    )

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(require_roles(["neighbor", "admin"])),
    db: Session = Depends(get_db)
):
    return task_service.create_task(db, current_user, task_in)

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    return task_service.get_task(db, task_id)

@router.post("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: str,
    completion_in: TaskCompletionRequest,
    current_user: User = Depends(require_roles(["student", "admin"])),
    db: Session = Depends(get_db)
):
    return task_service.complete_task(db, task_id, current_user, completion_in)
