from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.task_repository import task_repository
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskCompletionRequest

class TaskService:
    def create_task(self, db: Session, creator: User, task_in: TaskCreate) -> Task:
        if creator.role not in ["neighbor", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only residents/neighbors can post new tasks."
            )
        
        task = Task(
            creator_id=creator.id,
            title=task_in.title.strip(),
            description=task_in.description.strip(),
            category=task_in.category.strip(),
            budget=task_in.budget,
            lat=task_in.lat,
            lon=task_in.lon,
            address=task_in.address.strip(),
            status="open"
        )
        return task_repository.create(db, task)

    def get_task(self, db: Session, task_id: str) -> Task:
        task = task_repository.get_with_details(db, task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )
        return task

    def list_tasks(
        self,
        db: Session,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        radius_km: Optional[float] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Task]:
        return task_repository.filter_tasks(
            db,
            category=category,
            status=status_filter,
            user_lat=user_lat,
            user_lon=user_lon,
            radius_km=radius_km,
            skip=skip,
            limit=limit
        )

    def complete_task(
        self, db: Session, task_id: str, student: User, completion_in: TaskCompletionRequest
    ) -> Task:
        task = self.get_task(db, task_id)
        if task.assigned_to != student.id and student.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned student helper can mark this task as completed."
            )
        
        return task_repository.update(db, task, {
            "status": "completed",
            "completion_notes": completion_in.completion_notes.strip()
        })

task_service = TaskService()
