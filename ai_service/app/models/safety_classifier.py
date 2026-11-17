from typing import Dict, Any, List
from app.preprocessing.text_cleaner import clean_text

PROHIBITED_TERMS = [
    "weapon", "drug", "contraband", "illegal", "exploit", "hack", "fake id", "bribe", "abuse"
]

class SafetyClassifierModel:
    def evaluate(self, text: str) -> Dict[str, Any]:
        cleaned = clean_text(text)
        flags = []
        for term in PROHIBITED_TERMS:
            if term in cleaned:
                flags.append(term)
        
        if flags:
            return {
                "is_safe": False,
                "risk_level": "HIGH",
                "flags": flags
            }
        
        return {
            "is_safe": True,
            "risk_level": "LOW",
            "flags": []
        }

safety_classifier_model = SafetyClassifierModel()
