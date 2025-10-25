import uvicorn

from .config import get_settings


def run_server() -> None:
    settings = get_settings()

    uvicorn.run(
        "src.main:app",
        host=settings.server.host,
        port=settings.server.port,
        reload=settings.server.reload,
        workers=settings.server.workers,
        log_level=settings.logging.level.lower(),
        access_log=True,
        log_config=None,  # Disable uvicorn's default logging config
        use_colors=False,  # Disable uvicorn's colors since we handle them
    )
