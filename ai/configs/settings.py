import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Production configuration for Zosh Bazaar AI/ML Platform."""

    SERVICE_NAME: str = "zosh-bazaar-ai"
    SERVICE_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1

    # Database & Storage
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb+srv://rahulraj21480:Rahul2148@rahul-projects.wf7wibr.mongodb.net/Zosh-Bazaar-Ecommerce_Multivendor?retryWrites=true&w=majority&appName=Rahul-Projects",
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
    AI_DATA_DIR: str = os.getenv("AI_DATA_DIR", "ai/data")
    MODEL_REGISTRY_PATH: str = os.getenv("MODEL_REGISTRY_PATH", "ai/models/registry.json")

    # Recommendation Hyperparameters & Weights
    CANDIDATE_POOL_SIZE: int = 100
    DEFAULT_RECOMMENDATION_LIMIT: int = 12
    MAX_RECOMMENDATION_LIMIT: int = 50
    CACHE_TTL_RECOMMENDATIONS_SEC: int = 300
    CACHE_TTL_USER_AFFINITIES_SEC: int = 600

    # Model Weights for Multi-Stage Hybrid Ranker
    WEIGHT_PERSONALIZED: float = 0.30
    WEIGHT_CONTENT: float = 0.25
    WEIGHT_COLLABORATIVE: float = 0.20
    WEIGHT_SESSION: float = 0.15
    WEIGHT_POPULARITY: float = 0.10

    # Event Telemetry Weights for Implicit Feedback
    EVENT_WEIGHT_PURCHASE: float = 5.0
    EVENT_WEIGHT_CART: float = 3.0
    EVENT_WEIGHT_WISHLIST: float = 2.0
    EVENT_WEIGHT_VIEW: float = 1.0
    EVENT_WEIGHT_IMPRESSION: float = 0.1

    # Security & CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
    ]
    INTERNAL_API_KEY: str = os.getenv("INTERNAL_API_KEY", "zb_ai_secret_internal_key_v1")

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=(".env", "../server/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
