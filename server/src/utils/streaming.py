"""Utilities for streaming responses."""

import json
from enum import Enum
from typing import Any


class StreamEventType(str, Enum):
    """Types of streaming events."""

    TOKEN = "token"
    ERROR = "error"
    DONE = "done"
    METADATA = "metadata"


class SSEFormatter:
    """Server-Sent Events (SSE) formatter."""

    @staticmethod
    def format_event(event_type: StreamEventType, data: Any = None) -> str:
        """
        Format an SSE event.

        Args:
            event_type: Type of the event
            data: Optional data payload

        Returns:
            Formatted SSE string
        """
        if event_type == StreamEventType.DONE:
            return "data: [DONE]\n\n"

        if data is None:
            return ""

        payload = {event_type.value: data}
        return f"data: {json.dumps(payload)}\n\n"

    @staticmethod
    def format_token(token: str) -> str:
        """
        Format a token event.

        Args:
            token: Token string

        Returns:
            Formatted SSE string
        """
        return SSEFormatter.format_event(StreamEventType.TOKEN, token)

    @staticmethod
    def format_error(error_message: str) -> str:
        """
        Format an error event.

        Args:
            error_message: Error message

        Returns:
            Formatted SSE string
        """
        return SSEFormatter.format_event(StreamEventType.ERROR, error_message)

    @staticmethod
    def format_done() -> str:
        """
        Format a completion event.

        Returns:
            Formatted SSE string
        """
        return SSEFormatter.format_event(StreamEventType.DONE)

    @staticmethod
    def format_metadata(metadata: dict) -> str:
        """
        Format a metadata event.

        Args:
            metadata: Metadata dictionary

        Returns:
            Formatted SSE string
        """
        return SSEFormatter.format_event(StreamEventType.METADATA, metadata)
