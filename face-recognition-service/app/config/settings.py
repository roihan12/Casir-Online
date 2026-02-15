from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_NAME: str = "Face Recognition Service"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    API_KEY: str = os.getenv("API_KEY", "face-service-api-key")

    # Face Recognition
    FACE_MODEL: str = "buffalo_l"  # Options: buffalo_l, buffalo_m
    FACE_DETECTOR_RETINA: bool = True
    SIMILARITY_THRESHOLD: float = 0.4  # Lower = more strict

    # Liveness Detection
    LIVENESS_ENABLED: bool = True
    BLINK_THRESHOLD: float = 0.25  # Eye aspect ratio threshold
    BLINK_CONSEC_FRAMES: int = 2   # Consecutive frames for blink
    TEXTURE_THRESHOLD: float = 0.6  # Texture analysis threshold
    LIVENESS_THRESHOLD: float = 0.5  # Overall liveness score

    # Image Processing
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png"}
    MIN_FACE_SIZE: int = 80  # Minimum face size in pixels

    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    # Logging
    LOG_LEVEL: str = "INFO"

    # Cache
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 3600  # seconds

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
