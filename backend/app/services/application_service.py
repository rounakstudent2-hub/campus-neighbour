from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.application_repository import application_repository
from app.repositories.task_repository import task_repository
from app.models.application import Application
from app.models.user import User
from app.schemas.application import ApplicationCreate

class ApplicationService:
    def apply_to_task(self, db: Session, student: User, app_in: ApplicationCreate) -> Application:
        if student.role != "student" and student.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only registered students can apply for chores."
            )
        
        task = task_repository.get(db, app_in.task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        
        if task.status != "open":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This task is no longer accepting applications.")
        
        existing = application_repository.get_by_task_and_student(db, app_in.task_id, student.id)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already submitted an application for this task.")
        
        application = Application(
            task_id=app_in.task_id,
            student_id=student.id,
            proposed_fee=app_in.proposed_fee,
            pitch=app_in.pitch.strip(),
            status="applied"
        )
        return application_repository.create(db, application)

    def hire_applicant(self, db: Session, neighbor: User, application_id: str) -> Application:
        application = application_repository.get(db, application_id)
        if not application:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
        
        task = task_repository.get(db, application.task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        
        if task.creator_id != neighbor.id and neighbor.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the task creator can hire an applicant.")
        
        if task.status != "open":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task is already assigned or closed.")
        
        # Accept this application
        application_repository.update(db, application, {"status": "accepted"})
        
        # Update task status and assigned student
        task_repository.update(db, task, {
            "status": "assigned",
            "assigned_to": application.student_id,
            "budget": application.proposed_fee
        })

        # Reject all other pending applications for this chore
        all_apps = application_repository.get_by_task(db, task.id)
        for other_app in all_apps:
            if other_app.id != application.id and other_app.status == "applied":
                application_repository.update(db, other_app, {"status": "rejected"})

        return application

    def list_task_applications(self, db: Session, task_id: str) -> List[Application]:
        return application_repository.get_by_task(db, task_id)

application_service = ApplicationService()
