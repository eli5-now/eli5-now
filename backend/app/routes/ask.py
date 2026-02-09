"""Ask endpoint for streaming Q&A."""

import asyncio

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.streaming import StreamEvent

router = APIRouter()


class AskRequest(BaseModel):
    """Request body for /ask endpoint."""

    question: str
    age: int = 5
    story_mode: bool = False


async def generate_mock_response(question: str):
    """Generate mock streaming events."""
    # Thinking event
    yield StreamEvent(
        event_type="thinking",
        content="Let me think about that...",
    ).to_sse()
    await asyncio.sleep(0.5)

    # Text response (mock)
    response = f"That's a great question about '{question}'! Here's a simple explanation just for you."
    yield StreamEvent(
        event_type="text",
        content=response,
    ).to_sse()
    await asyncio.sleep(0.1)

    # Done event
    yield StreamEvent(event_type="done").to_sse()


@router.post("/ask")
async def ask(request: AskRequest):
    """Stream a response to the user's question."""
    return StreamingResponse(
        generate_mock_response(request.question),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
