from pydantic_settings import BaseSettings, SettingsConfigDict

class AISettings(BaseSettings):
    SERVICE_NAME: str = "CampusNeighbor AI Intelligence Service"
    VERSION: str = "1.0.0"
    PORT: int = 8001
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

ai_settings = AISettings()
