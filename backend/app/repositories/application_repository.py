from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.models.application import Application

class ApplicationRepository(BaseRepository[Application]):
    def __init__(self):
        super().__init__(Application)

    def get_by_task_and_student(self, db: Session, task_id: str, student_id: str) -> Optional[Application]:
        return (
            db.query(Application)
            .filter(Application.task_id == task_id, Application.student_id == student_id)
            .first()
        )

    def get_by_task(self, db: Session, task_id: str) -> List[Application]:
        return (
            db.query(Application)
            .options(joinedload(Application.student))
            .filter(Application.task_id == task_id)
            .order_by(Application.created_at.desc())
            .all()
        )

    def get_by_student(self, db: Session, student_id: str) -> List[Application]:
        return (
            db.query(Application)
            .options(joinedload(Application.task))
            .filter(Application.student_id == student_id)
            .order_by(Application.created_at.desc())
            .all()
        )

application_repository = ApplicationRepository()
