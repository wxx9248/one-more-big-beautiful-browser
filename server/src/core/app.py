"""
FastAPI application factory.

This module contains the main application factory function that creates
and configures the FastAPI application with all necessary components.
"""

from fastapi import FastAPI

from .config import get_settings
from .lifespan import lifespan
from .middleware import setup_middleware
from .routers import setup_routers


def create_application() -> FastAPI:
    settings = get_settings()

    # Create FastAPI app with configuration
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=settings.app_description,
        lifespan=lifespan,
        docs_url=(
            settings.api.docs_url if settings.environment == "development" else None
        ),
        redoc_url=(
            settings.api.redoc_url if settings.environment == "development" else None
        ),
        openapi_url=(
            settings.api.openapi_url if settings.environment == "development" else None
        ),
    )

    # Add middleware
    setup_middleware(app, settings)

    # Setup routers and endpoints
    setup_routers(app)

    return app
