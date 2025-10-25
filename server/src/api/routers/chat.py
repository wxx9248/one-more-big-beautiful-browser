from fastapi import APIRouter, HTTPException

from src.controllers.chat_controller import ChatController
from src.models import ChatRequest, ChatResponse

router = APIRouter()
chat_controller = ChatController()


@router.post(
    "/",
    response_model=ChatResponse,
    responses={
        200: {"description": "Chat response", "model": ChatResponse},
        500: {"description": "Internal server error"},
    },
)
async def chat(request: ChatRequest):
    """
    Chat endpoint using LangGraph.

    Example request for new conversation:
    ```json
    {
        "messages": [
            {"role": "user", "content": "Hello!"}
        ]
    }
    ```

    Example request for continuing conversation:
    ```json
    {
        "messages": [
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Hi! How can I help?"},
            {"role": "user", "content": "Tell me about Python"}
        ],
        "model": "openai:gpt-4o-mini",
        "temperature": 0.7
    }
    ```

    Args:
        request: Chat request containing ALL messages (including history), optional model and temperature

    Returns:
        ChatResponse with the assistant's message and used model
    """
    try:
        response = await chat_controller.chat(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
