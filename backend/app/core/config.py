from functools import lru_cache
from typing import List

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Configuración principal del backend."""

    app_name: str = Field("Coopeenortol API", env="APP_NAME")
    app_version: str = Field("0.1.0", env="APP_VERSION")
    database_url: str = Field("sqlite:///backend/data/coopeenortol.db", env="DATABASE_URL")
    backend_cors_origins: str = Field("", env="BACKEND_CORS_ORIGINS")

    @property
    def cors_origins(self) -> List[str]:
        if not self.backend_cors_origins:
            return []
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
