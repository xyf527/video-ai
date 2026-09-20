from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration needed by the bootstrap application.

    Future infrastructure settings intentionally do not belong here yet. Keeping
    this model small means the health endpoint can start without external services.
    """

    app_name: str = "AI Video Knowledge Assistant"
    environment: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
