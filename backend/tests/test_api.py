import pytest
import asyncio
from app.db.session import SessionLocal
from app.db.seed import init_db_and_seed
from app.api.v1.endpoints.health import health_check
from app.api.v1.endpoints.auth import login
from app.api.v1.endpoints.tasks import list_tasks
from app.api.v1.endpoints.admin import get_platform_metrics
from app.api.v1.endpoints.ai_proxy import compute_match_score, estimate_price
from app.schemas.user import UserLogin
from app.schemas.ai import MatchRequest, PriceEstimateRequest
from app.repositories.user_repository import user_repository
from app.core.config import settings

# Setup database
init_db_and_seed()

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_health_check_endpoint(db):
    result = health_check(db)
    assert result["status"] == "ok"
    assert "uptime_seconds" in result
    assert result["database"]["status"] == "connected"

def test_auth_login_endpoint(db):
    res = login(UserLogin(email="priya.neighbor@gmail.com", password="neighbor123"), db)
    assert res.access_token is not None
    assert res.user.role == "neighbor"
    assert res.user.email == "priya.neighbor@gmail.com"

def test_tasks_listing_and_geofilter(db):
    tasks = list_tasks(lat=12.9784, lon=77.6408, radius=20, db=db)
    assert isinstance(tasks, list)
    assert len(tasks) > 0
    assert tasks[0].distance_km is not None
    assert tasks[0].distance_km <= 20.0

def test_ai_proxy_matchmaker_and_pricing(monkeypatch):
    monkeypatch.setattr(settings, "AI_SERVICE_URL", "")
    
    match = compute_match_score(MatchRequest(
        task_title="Python Coding Homework Assistance",
        task_description="Need help with data structures in python",
        task_category="Tutoring and Academic Help",
        student_skills=["Python", "Data Structures"],
        student_bio="CS scholar",
        student_rating=4.9
    ))
    assert match.compatibility_score >= 60.0
    assert match.match_tier in ["Excellent", "Strong", "Moderate"]

    price = estimate_price(PriceEstimateRequest(
        category="Technology Assistance",
        description="Wi-Fi setup",
        distance_km=2.0,
        estimated_hours=1.0
    ))
    assert price.suggested_budget > 0
    assert price.currency == "INR"

def test_admin_metrics(db):
    admin_user = user_repository.get_by_email(db, "admin@marketplace.local")
    metrics = get_platform_metrics(admin_user, db)
    assert metrics["total_users"] >= 5
    assert metrics["total_tasks"] >= 3
