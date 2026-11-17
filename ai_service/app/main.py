from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import ai_settings
from app.api.endpoints import router as ai_router

app = FastAPI(
    title=ai_settings.SERVICE_NAME,
    version=ai_settings.VERSION,
    description="CampusNeighbor Machine Learning Subsystem for Matchmaking, Price Recommendation & Safety Guard"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": ai_settings.SERVICE_NAME,
        "version": ai_settings.VERSION,
        "models_loaded": ["matchmaker_tfidf", "price_recommender", "safety_classifier"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=ai_settings.PORT, reload=True)
