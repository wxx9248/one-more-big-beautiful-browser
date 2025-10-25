from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from src.controllers.chat_controller import ChatController
from src.models import ChatRequest, ChatResponse
from src.utils import SSEFormatter

router = APIRouter()
chat_controller = ChatController()


@router.post("/")
async def chat(request: ChatRequest):
    """
    Streaming chat endpoint using LangGraph.

    Returns Server-Sent Events (SSE) stream of tokens as they are generated.

    **Important**: Backend is stateless. Frontend must send ALL messages including conversation history.

    Example request:
    ```json
    {
        "messages": [
            {"role": "user", "content": "Hello!"}
        ],
        "model": "anthropic:claude-sonnet-4-5",
        "temperature": 0.7
    }
    ```

    Response format (SSE):
    ```
    data: {"token": "Hello"}
    data: {"token": "!"}
    data: {"token": " How"}
    data: [DONE]
    ```

    Args:
        request: Chat request containing ALL messages (including history), optional model and temperature

    Returns:
        StreamingResponse with SSE format
    """

    async def generate():
        try:
            async for token in chat_controller.chat_stream(
                messages=request.messages,
                model=request.model,
                temperature=request.temperature,
            ):
                yield SSEFormatter.format_token(token)

            yield SSEFormatter.format_done()

        except Exception as e:
            yield SSEFormatter.format_error(str(e))

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable buffering in nginx
        },
    )
