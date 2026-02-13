"""Ask endpoint for streaming Q&A."""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.eli import create_eli_agent
from app.config import settings
from app.messages import HistoryMessage, format_history_for_agent
from app.streaming import StreamEvent

router = APIRouter()


class AskRequest(BaseModel):
    """Request body for /ask endpoint."""

    question: str
    age: int = 5
    story_mode: bool = False
    history: list[HistoryMessage] = Field(default_factory=list)


async def generate_response(
    question: str, history: list[HistoryMessage], age: int, story_mode: bool
):
    """Generate streaming response using LLM."""
    # Thinking event
    yield StreamEvent(
        event_type="thinking",
        content="Let me think about that...",
    ).to_sse()

    # Create agent and generate response
    agent = create_eli_agent(settings, age, story_mode)
    response = await agent.run(format_history_for_agent(history) + question)

    # Text response
    yield StreamEvent(
        event_type="text",
        content=response.message.content or "",
    ).to_sse()

    # Done event
    yield StreamEvent(event_type="done").to_sse()


@router.post("/ask")
async def ask(request: AskRequest):
    """Stream a response to the user's question."""
    return StreamingResponse(
        generate_response(request.question, request.history, request.age, request.story_mode),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
