import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Type, TypeVar

from fastapi import FastAPI

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(f"Starting Service...")

    try:
        # TODO: Add future initialization steps here
        logger.info("Application startup completed")

    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down Service...")

    try:
        # TODO: Add future cleanup steps here
        logger.info("Application shutdown completed")

    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
