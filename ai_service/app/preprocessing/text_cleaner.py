import re

def clean_text(text: str) -> str:
    """Normalizes and cleans raw text input for NLP pipelines."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def extract_tokens(text: str) -> list[str]:
    cleaned = clean_text(text)
    return [t for t in cleaned.split(" ") if len(t) > 2]
