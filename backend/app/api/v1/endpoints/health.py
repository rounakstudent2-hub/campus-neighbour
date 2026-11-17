import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])

START_TIME = time.time()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "type": "PostgreSQL" if "postgres" in settings.DATABASE_URL else "SQLite",
            "status": db_status
        }
    }
