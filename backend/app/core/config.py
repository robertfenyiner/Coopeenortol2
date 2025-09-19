from functools import lru_cache
from typing import List

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Configuración principal del backend."""

    app_name: str = Field("Coopeenortol API", env="APP_NAME")
    app_version: str = Field("0.1.0", env="APP_VERSION")
    database_url: str = Field("sqlite:///backend/data/coopeenortol.db", env="DATABASE_URL")
    backend_cors_origins: str = Field("", env="BACKEND_CORS_ORIGINS")
    
    # Configuración de seguridad
    secret_key: str = Field("your-super-secret-key-change-in-production", env="SECRET_KEY")
    access_token_expire_minutes: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    email_reset_token_expire_hours: int = Field(48, env="EMAIL_RESET_TOKEN_EXPIRE_HOURS")
    
    # Configuración de email (para futuras funcionalidades)
    smtp_host: str = Field("", env="SMTP_HOST")
    smtp_port: int = Field(587, env="SMTP_PORT")
    smtp_user: str = Field("", env="SMTP_USER")
    smtp_password: str = Field("", env="SMTP_PASSWORD")
    
    # Configuración de archivos
    max_file_size_mb: int = Field(10, env="MAX_FILE_SIZE_MB")
    allowed_file_types: str = Field("pdf,doc,docx,jpg,jpeg,png", env="ALLOWED_FILE_TYPES")

    @property
    def cors_origins(self) -> List[str]:
        if not self.backend_cors_origins:
            return []
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]
    
    @property 
    def allowed_file_extensions(self) -> List[str]:
        return [ext.strip() for ext in self.allowed_file_types.split(",") if ext.strip()]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
