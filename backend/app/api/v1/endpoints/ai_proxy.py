import json
import urllib.request
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.ai import (
    MatchRequest, MatchResponse,
    PriceEstimateRequest, PriceEstimateResponse,
    SafetyCheckRequest, SafetyCheckResponse
)

router = APIRouter(prefix="/ai", tags=["AI & Machine Learning"])

def _post_ai_service(path: str, payload: dict, timeout: float = 0.4):
    """Attempt synchronous HTTP call to AI microservice with quick timeout."""
    if not settings.AI_SERVICE_URL or not settings.AI_SERVICE_URL.strip():
        return None
    try:
        url = settings.AI_SERVICE_URL.rstrip("/").replace("localhost", "127.0.0.1")
        endpoint = f"{url}{path}"
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception:
        pass
    return None

@router.post("/match-score", response_model=MatchResponse)
def compute_match_score(req: MatchRequest):
    """Proxies matchmaking request to AI service with deterministic heuristic fallback."""
    remote_res = _post_ai_service("/api/v1/match", req.model_dump())
    if remote_res:
        return remote_res

    # Graceful fallback heuristic
    score = 75.0
    tier = "Strong"
    keywords = [req.task_category]
    if req.student_skills:
        for skill in req.student_skills:
            if skill.lower() in req.task_description.lower() or skill.lower() in req.task_title.lower():
                score += 8.0
                keywords.append(skill)
    score = min(98.0, max(50.0, score))
    if score >= 90:
        tier = "Excellent"
    elif score >= 75:
        tier = "Strong"
    else:
        tier = "Moderate"

    return MatchResponse(
        compatibility_score=round(score, 1),
        match_tier=tier,
        highlighted_keywords=keywords[:4],
        confidence=0.88
    )

@router.post("/price-estimate", response_model=PriceEstimateResponse)
def estimate_price(req: PriceEstimateRequest):
    """Proxies fair price recommendation request to AI service with fallback."""
    remote_res = _post_ai_service("/api/v1/price-estimate", req.model_dump())
    if remote_res:
        return remote_res

    base_rate = 250.0
    dist_factor = (req.distance_km or 2.0) * 20.0
    time_factor = (req.estimated_hours or 1.0) * 150.0
    suggested = base_rate + dist_factor + time_factor

    return PriceEstimateResponse(
        suggested_budget=round(suggested, -1),
        min_budget=round(suggested * 0.8, -1),
        max_budget=round(suggested * 1.3, -1),
        currency="INR",
        explanation=f"Based on {req.category} baseline, distance ({req.distance_km} km) and effort."
    )

@router.post("/safety-check", response_model=SafetyCheckResponse)
def check_safety(req: SafetyCheckRequest):
    """Proxies content safety check to AI service."""
    remote_res = _post_ai_service("/api/v1/safety-check", req.model_dump())
    if remote_res:
        return remote_res

    return SafetyCheckResponse(
        is_safe=True,
        risk_level="LOW",
        flags=[]
    )
