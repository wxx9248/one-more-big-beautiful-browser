import logging
import logging.config
import sys
from typing import Dict, Any

from ..core.config import get_settings


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors and aligned spacing similar to uvicorn."""

    # Color codes
    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    def format(self, record):
        # Get color for log level
        level_color = self.COLORS.get(record.levelname, "")

        # Format timestamp with dim color
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        colored_timestamp = f"{self.DIM}{timestamp}{self.RESET}"

        # Format level with color and fixed width (8 chars)
        colored_level = f"{level_color}{record.levelname:<8}{self.RESET}"

        # Format logger name with dim color and fixed width (30 chars)
        logger_name = record.name
        if len(logger_name) > 28:
            logger_name = "..." + logger_name[-25:]
        colored_logger = f"{self.DIM}{logger_name:<30}{self.RESET}"

        # Format function and line info with dim color
        func_info = f"{record.funcName}:{record.lineno}"
        colored_func = f"{self.DIM}{func_info:<20}{self.RESET}"

        # Format message
        message = record.getMessage()

        # Combine all parts with proper spacing
        formatted = f"{colored_timestamp} {colored_level} {colored_logger} {colored_func} {message}"

        # Handle exceptions
        if record.exc_info and not record.exc_text:
            record.exc_text = self.formatException(record.exc_info)
        if record.exc_text:
            formatted += "\n" + record.exc_text
        if record.stack_info:
            formatted += "\n" + self.formatStack(record.stack_info)

        return formatted


class UvicornColoredFormatter(logging.Formatter):
    """Custom formatter for uvicorn logs to match application style."""

    # Color codes
    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    def format(self, record):
        # Get color for log level
        level_color = self.COLORS.get(record.levelname, "")

        # Format timestamp with dim color
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        colored_timestamp = f"{self.DIM}{timestamp}{self.RESET}"

        # Format level with color and fixed width (8 chars)
        colored_level = f"{level_color}{record.levelname:<8}{self.RESET}"

        # Format logger name with dim color and fixed width (30 chars)
        logger_name = "uvicorn"
        colored_logger = f"{self.DIM}{logger_name:<30}{self.RESET}"

        # Format function info with dim color
        colored_func = f"{self.DIM}{'server':<20}{self.RESET}"

        # Format message
        message = record.getMessage()

        # Combine all parts with proper spacing
        formatted = f"{colored_timestamp} {colored_level} {colored_logger} {colored_func} {message}"

        return formatted


def setup_logging() -> None:
    """
    Set up application logging configuration.

    This function configures logging for the entire application based on
    the settings from the configuration system.
    """
    settings = get_settings()

    # Define logging configuration
    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "colored": {
                "()": ColoredFormatter,
            },
            "uvicorn_colored": {
                "()": UvicornColoredFormatter,
            },
            "json": {
                "format": '{"timestamp": "%(asctime)s", "logger": "%(name)s", "level": "%(levelname)s", "message": "%(message)s"}',
                "datefmt": "%Y-%m-%dT%H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": settings.logging.level,
                "formatter": "colored",
                "stream": sys.stdout,
            },
            "uvicorn_console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "uvicorn_colored",
                "stream": sys.stdout,
            },
        },
        "loggers": {
            # Application loggers
            "src": {
                "level": settings.logging.level,
                "handlers": ["console"],
                "propagate": False,
            },
            # Uvicorn loggers with custom formatting
            "uvicorn": {
                "level": "INFO",
                "handlers": ["uvicorn_console"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["uvicorn_console"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["uvicorn_console"],
                "propagate": False,
            },
            # Third-party library loggers
            "sqlalchemy.engine": {
                "level": (
                    "WARNING" if not settings.environment == "development" else "INFO"
                ),
                "handlers": ["console"],
                "propagate": False,
            },
            "google.cloud": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False,
            },
        },
        "root": {
            "level": settings.logging.level,
            "handlers": ["console"],
        },
    }

    # Apply the logging configuration
    logging.config.dictConfig(logging_config)

    # Log the successful setup
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {settings.logging.level}")
