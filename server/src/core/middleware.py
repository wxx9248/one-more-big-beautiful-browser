import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from .config import Settings

logger = logging.getLogger(__name__)


def setup_middleware(app: FastAPI, settings: Settings) -> None:
    """
    Set up application middleware.

    Args:
        app: FastAPI application instance
        settings: Application settings
    """
    # CORS middleware - only enabled in development environment
    # In production, cross-origin requests are completely disabled for security
    if settings.environment == "development":
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.server.cors_origins,
            allow_credentials=True,
            allow_methods=settings.server.cors_methods,
            allow_headers=settings.server.cors_headers,
        )

    # Trusted host middleware (security)
    if settings.environment == "production":
        app.add_middleware(
            TrustedHostMiddleware, allowed_hosts=settings.server.allowed_hosts
        )

    # Request logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log all HTTP requests."""
        start_time = time.time()

        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {request.client.host if request.client else 'unknown'}"
        )

        # Process request
        response = await call_next(request)

        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} " f"(processed in {process_time:.3f}s)"
        )

        return response
