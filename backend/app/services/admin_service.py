from sqlalchemy.orm import Session
from app.repositories.user_repository import user_repository
from app.repositories.task_repository import task_repository
from app.repositories.escrow_repository import escrow_repository
from app.models.report import Report
from app.models.user import User

class AdminService:
    def get_metrics(self, db: Session) -> dict:
        total_users = user_repository.count_total(db)
        total_tasks = task_repository.count_total(db)
        open_tasks = task_repository.count_total(db, status="open")
        completed_tasks = task_repository.count_total(db, status="completed")
        escrow_volume = escrow_repository.get_total_volume(db)
        pending_reports = db.query(Report).filter(Report.status == "pending").count()

        return {
            "total_users": total_users,
            "total_tasks": total_tasks,
            "open_tasks": open_tasks,
            "completed_tasks": completed_tasks,
            "escrow_volume_inr": escrow_volume,
            "pending_reports": pending_reports
        }

    def set_user_status(self, db: Session, user_id: str, is_active: bool) -> User:
        user = user_repository.get(db, user_id)
        if not user:
            raise Exception("User not found.")
        return user_repository.update(db, user, {"is_active": is_active})

admin_service = AdminService()
