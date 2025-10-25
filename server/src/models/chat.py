"""Chat-related Pydantic models."""

from src.api.models import CamelCaseModel


class Message(CamelCaseModel):
    """Individual chat message."""

    role: str
    content: str


class ChatRequest(CamelCaseModel):
    """
    Chat request model.

    Frontend should send ALL messages including conversation history.
    Example for first message:
        {"messages": [{"role": "user", "content": "Hello!"}]}

    Example for continuing conversation:
        {"messages": [
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Hi! How can I help?"},
            {"role": "user", "content": "Tell me about Python"}
        ]}
    """

    messages: list[Message]
    model: str | None = None
    temperature: float | None = None


class ChatResponse(CamelCaseModel):
    """Chat response model."""

    message: str
    model: str
