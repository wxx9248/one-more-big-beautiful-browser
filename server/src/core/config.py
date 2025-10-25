from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv()


class ServerSettings(BaseSettings):
    """Server configuration."""

    host: str = Field("127.0.0.1", description="Server host")
    port: int = Field(8000, description="Server port")
    reload: bool = Field(True, description="Auto-reload on code changes")
    workers: int = Field(1, description="Number of worker processes")

    # CORS settings
    cors_origins: list[str] = Field(["*"], description="Allowed CORS origins")
    cors_methods: list[str] = Field(["*"], description="Allowed CORS methods")
    cors_headers: list[str] = Field(["*"], description="Allowed CORS headers")

    # Security settings
    allowed_hosts: list[str] = Field(
        ["*"], description="Allowed hosts for TrustedHostMiddleware"
    )

    class Config:
        env_prefix = "SERVER_"
        case_sensitive = False


class LoggingSettings(BaseSettings):
    """Logging configuration."""

    level: str = Field("INFO", description="Logging level")

    class Config:
        env_prefix = "LOG_"
        case_sensitive = False


class APISettings(BaseSettings):
    """API configuration."""

    # API path prefixes
    test_prefix: str = Field("/api/test", description="Test API prefix")

    # Internal API prefixes (no authentication required)
    internal_prefix: str = Field(
        "/internal", description="Internal service communication API prefix"
    )

    # API documentation URLs
    docs_url: str = Field("/docs", description="Swagger documentation URL")
    redoc_url: str = Field("/redoc", description="ReDoc documentation URL")
    openapi_url: str = Field("/openapi.json", description="OpenAPI JSON URL")

    class Config:
        env_prefix = "API_"
        case_sensitive = False


class Settings(BaseSettings):
    """Main application settings."""

    # Application info
    app_name: str = Field("Server", description="Application name")
    app_description: str = Field("API server", description="Application description")
    app_version: str = Field("0.0.0", description="Application version")
    environment: str = Field(
        "development", description="Environment (development, production)"
    )

    # Component settings
    server: ServerSettings = ServerSettings()
    api: APISettings = APISettings()
    logging: LoggingSettings = LoggingSettings()

    @classmethod
    def validate_environment(cls, v):
        """Validate environment value."""
        allowed = ["development", "production"]
        if v not in allowed:
            raise ValueError(f"Environment must be one of: {allowed}")
        return v

    class Config:
        case_sensitive = False
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """
    Get application settings with caching.

    Returns:
        Settings: Cached application settings instance
    """
    return Settings()
