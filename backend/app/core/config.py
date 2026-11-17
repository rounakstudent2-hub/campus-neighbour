from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusNeighbor API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    JWT_SECRET: str = "super-secret-neighborhood-marketplace-key-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = "sqlite:///./campus_neighbor.sqlite"
    DATABASE_SSL: bool = False
    
    AI_SERVICE_URL: str = "http://localhost:8001"
    
    RAZORPAY_KEY_ID: Optional[str] = "rzp_test_campusneighbor"
    RAZORPAY_KEY_SECRET: Optional[str] = "dummy_secret"
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
