from typing import Dict, Any

CATEGORY_BASE_RATES = {
    "grocery and shopping assistance": 200.0,
    "home assistance": 300.0,
    "pet care": 350.0,
    "tutoring and academic help": 500.0,
    "document delivery": 180.0,
    "technology assistance": 400.0,
    "event assistance": 350.0,
    "errands and personal assistance": 250.0,
    "other local tasks": 250.0
}

class PriceRecommenderModel:
    def estimate_price(
        self,
        category: str,
        description: str,
        distance_km: float = 2.0,
        estimated_hours: float = 1.0
    ) -> Dict[str, Any]:
        cat_key = category.strip().lower()
        base = CATEGORY_BASE_RATES.get(cat_key, 250.0)

        # Distance penalty: 15 INR per km beyond 1 km
        dist_factor = max(0.0, (distance_km - 1.0)) * 18.0
        
        # Duration scale:
        hourly_rate = base * 0.75
        time_factor = max(1.0, estimated_hours) * hourly_rate

        # Complexity keyword adjustments
        desc_lower = description.lower()
        complexity_add = 0.0
        if any(w in desc_lower for w in ["heavy", "urgent", "exam", "coding", "repair", "assembly"]):
            complexity_add += 120.0

        suggested = base + dist_factor + (time_factor - hourly_rate) + complexity_add
        suggested = round(suggested / 10.0) * 10.0  # Round to nearest 10 INR

        return {
            "suggested_budget": float(suggested),
            "min_budget": float(round((suggested * 0.8) / 10.0) * 10.0),
            "max_budget": float(round((suggested * 1.3) / 10.0) * 10.0),
            "currency": "INR",
            "explanation": f"Calculated using {category} market baseline, {distance_km} km distance, and effort estimation."
        }

price_recommender_model = PriceRecommenderModel()
