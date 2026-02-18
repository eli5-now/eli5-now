"""Ask endpoint for streaming Q&A."""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from llama_index.core.llms import ChatMessage
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.workflow import Context
from pydantic import BaseModel, Field

from app.agents.eli import create_eli_agent
from app.config import settings
from app.messages import HistoryMessage
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

    memory = ChatMemoryBuffer.from_defaults(
        token_limit=settings.max_tokens - settings.response_token_buffer
    )

    for msg in history:
        memory.put(ChatMessage(role=msg.role, content=msg.content))

    response = await agent.run(question, ctx=Context(agent), memory=memory)

    # Text response
    yield StreamEvent(event_type="text", content=str(response) or "").to_sse()

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
