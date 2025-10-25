from fastapi import FastAPI

from .config import get_settings
from ..api.routers import test, chat


def setup_routers(app: FastAPI) -> None:
    """
    Set up all API routers for the application.

    Args:
        app: FastAPI application instance
    """
    settings = get_settings()

    # Add root endpoint
    @app.get("/")
    async def root():
        """Root endpoint providing basic API information."""
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
            "docsUrl": (
                settings.api.docs_url if settings.environment == "development" else None
            ),
        }

    # Core system endpoints
    app.include_router(test.router, prefix=settings.api.test_prefix, tags=["test"])
    app.include_router(chat.router, prefix=settings.api.chat_prefix, tags=["chat"])
