import pytest
from app.api.endpoints import (
    predict_match, predict_price, check_safety,
    MatchInput, PriceInput, SafetyInput
)
from app.main import health
from app.preprocessing.text_cleaner import clean_text, extract_tokens
from app.models.matchmaker import matchmaker_model
from app.models.price_recommender import price_recommender_model
from app.models.safety_classifier import safety_classifier_model

def test_preprocessing():
    raw = "Need urgent Dog-Walking! & Pet feeding in INDIRANAGAR."
    cleaned = clean_text(raw)
    assert "urgent" in cleaned
    assert "dog" in cleaned
    assert "!" not in cleaned

    tokens = extract_tokens(raw)
    assert "walking" in tokens
    assert "dog" in tokens

def test_matchmaker_model():
    result = matchmaker_model.compute_compatibility(
        task_title="Python and Mathematics Tutor",
        task_desc="Coaching for Class 10 student in Algebra and basic coding",
        category="Tutoring and Academic Help",
        skills=["Python", "Mathematics", "Calculus"],
        bio="M.Tech scholar at IISc",
        college="IISc Bangalore",
        rating=5.0
    )
    assert result["compatibility_score"] >= 80.0
    assert result["match_tier"] in ["Excellent", "Strong"]
    assert "confidence" in result

def test_price_recommender():
    result = price_recommender_model.estimate_price(
        category="Pet Care",
        description="Dog walking for 2 hours",
        distance_km=3.5,
        estimated_hours=2.0
    )
    assert result["suggested_budget"] > 300.0
    assert result["min_budget"] < result["suggested_budget"]
    assert result["max_budget"] > result["suggested_budget"]
    assert result["currency"] == "INR"

def test_safety_classifier():
    safe_result = safety_classifier_model.evaluate("Help me assemble an IKEA desk and books")
    assert safe_result["is_safe"] is True
    assert safe_result["risk_level"] == "LOW"

    unsafe_result = safety_classifier_model.evaluate("Looking for someone to help buy illegal drugs")
    assert unsafe_result["is_safe"] is False
    assert unsafe_result["risk_level"] == "HIGH"
    assert "illegal" in unsafe_result["flags"] or "drug" in unsafe_result["flags"]

def test_ai_api_endpoints():
    health_resp = health()
    assert health_resp["status"] == "ok"
    assert "matchmaker_tfidf" in health_resp["models_loaded"]

    match_resp = predict_match(MatchInput(
        task_title="Grocery Shopping Assistance",
        task_description="Need fresh vegetables from local market",
        task_category="Grocery and Shopping Assistance",
        student_skills=["Shopping", "Local delivery"],
        student_bio="College student living nearby",
        student_college="Christ University",
        student_rating=4.8
    ))
    assert match_resp["compatibility_score"] > 60.0

    price_resp = predict_price(PriceInput(
        category="Grocery and Shopping Assistance",
        description="Market pickup and delivery",
        distance_km=1.5,
        estimated_hours=1.0
    ))
    assert price_resp["suggested_budget"] > 150.0

    safety_resp = check_safety(SafetyInput(text="Normal task request"))
    assert safety_resp["is_safe"] is True
