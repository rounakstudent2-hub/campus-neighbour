from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import require_roles
from app.services.admin_service import admin_service
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Administrator Console"])

@router.get("/metrics")
def get_platform_metrics(
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    return admin_service.get_metrics(db)

@router.put("/users/{user_id}/status")
def toggle_user_active_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    updated = admin_service.set_user_status(db, user_id, is_active)
    return {"user_id": updated.id, "is_active": updated.is_active}
