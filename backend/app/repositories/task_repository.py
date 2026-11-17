from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.models.task import Task
from app.models.application import Application
from app.utils.geo import haversine_distance

class TaskRepository(BaseRepository[Task]):
    def __init__(self):
        super().__init__(Task)

    def get_with_details(self, db: Session, task_id: str) -> Optional[Task]:
        return (
            db.query(Task)
            .options(joinedload(Task.creator), joinedload(Task.assigned_student))
            .filter(Task.id == task_id)
            .first()
        )

    def filter_tasks(
        self,
        db: Session,
        category: Optional[str] = None,
        status: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        radius_km: Optional[float] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Task]:
        query = db.query(Task).options(joinedload(Task.creator), joinedload(Task.assigned_student))
        
        # Safely handle string checks
        if isinstance(category, str) and category.strip() and category.lower() != "all":
            query = query.filter(Task.category.ilike(category.strip()))
        
        if isinstance(status, str) and status.strip():
            query = query.filter(Task.status == status.strip().lower())

        query = query.order_by(Task.created_at.desc())
        all_matching = query.all()

        results = []
        for task in all_matching:
            dist = None
            if user_lat is not None and user_lon is not None:
                dist = haversine_distance(user_lat, user_lon, task.lat, task.lon)
                if radius_km is not None and dist > radius_km:
                    continue
            
            task.distance_km = dist
            task.applications_count = db.query(Application).filter(Application.task_id == task.id).count()
            results.append(task)

        actual_skip = skip if isinstance(skip, int) else 0
        actual_limit = limit if isinstance(limit, int) else 100
        return results[actual_skip : actual_skip + actual_limit]

    def count_total(self, db: Session, status: Optional[str] = None) -> int:
        q = db.query(Task)
        if status:
            q = q.filter(Task.status == status)
        return q.count()

task_repository = TaskRepository()
