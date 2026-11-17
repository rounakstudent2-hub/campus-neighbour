import math
from collections import Counter
from typing import List, Dict, Any
from app.preprocessing.text_cleaner import clean_text

class PurePythonTfidf:
    def __init__(self):
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}

    def fit_transform(self, docs: List[str]) -> List[List[float]]:
        doc_tokens = [[t for t in d.lower().split() if len(t) > 2] for d in docs]
        N = len(docs)
        all_terms = set(t for dt in doc_tokens for t in dt)
        self.vocabulary = {term: idx for idx, term in enumerate(sorted(all_terms))}
        for term in self.vocabulary:
            df = sum(1 for dt in doc_tokens if term in dt)
            self.idf[term] = math.log((1 + N) / (1 + df)) + 1.0

        vectors: List[List[float]] = []
        for dt in doc_tokens:
            counts = Counter(dt)
            vec = [0.0] * len(self.vocabulary)
            for t, cnt in counts.items():
                if t in self.vocabulary:
                    tf = cnt / len(dt) if dt else 0.0
                    vec[self.vocabulary[t]] = tf * self.idf[t]
            norm = math.sqrt(sum(v * v for v in vec))
            if norm > 0:
                vec = [v / norm for v in vec]
            vectors.append(vec)
        return vectors

def compute_cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2:
        return 0.0
    return sum(a * b for a, b in zip(v1, v2))

class MatchmakerModel:
    def __init__(self):
        self.vectorizer = PurePythonTfidf()

    def compute_compatibility(
        self,
        task_title: str,
        task_desc: str,
        category: str,
        skills: List[str],
        bio: str,
        college: str,
        rating: float = 5.0
    ) -> Dict[str, Any]:
        task_corpus = clean_text(f"{task_title} {task_desc} {category}")
        student_skills_str = " ".join(skills) if skills else ""
        student_corpus = clean_text(f"{student_skills_str} {bio} {college} {category}")

        if not student_corpus.strip():
            return {
                "compatibility_score": 60.0,
                "match_tier": "Moderate",
                "highlighted_keywords": [category],
                "confidence": 0.70
            }

        try:
            vectors = self.vectorizer.fit_transform([task_corpus, student_corpus])
            cos_sim = compute_cosine_similarity(vectors[0], vectors[1])
            
            matched_keywords = []
            inv_vocab = {v: k for k, v in self.vectorizer.vocabulary.items()}
            for idx, (val1, val2) in enumerate(zip(vectors[0], vectors[1])):
                if val1 > 0 and val2 > 0:
                    matched_keywords.append(inv_vocab[idx])
        except Exception:
            cos_sim = 0.25
            matched_keywords = [category]

        rating_boost = (rating / 5.0) * 20.0
        nlp_score = min(50.0, cos_sim * 150.0)
        keyword_bonus = min(20.0, len(matched_keywords) * 5.0)
        base_score = 10.0
        final_score = min(99.0, max(45.0, base_score + nlp_score + keyword_bonus + rating_boost))

        if final_score >= 85:
            tier = "Excellent"
        elif final_score >= 72:
            tier = "Strong"
        elif final_score >= 55:
            tier = "Moderate"
        else:
            tier = "Low"

        return {
            "compatibility_score": round(float(final_score), 1),
            "match_tier": tier,
            "highlighted_keywords": matched_keywords[:4] if matched_keywords else [category],
            "confidence": 0.92
        }

matchmaker_model = MatchmakerModel()
