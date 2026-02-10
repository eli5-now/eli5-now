"""Ask endpoint for streaming Q&A."""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from llama_index.core.llms import ChatMessage
from pydantic import BaseModel

from app.config import settings
from app.llm import get_llm
from app.streaming import StreamEvent

router = APIRouter()


class AskRequest(BaseModel):
    """Request body for /ask endpoint."""

    question: str
    age: int = 5
    story_mode: bool = False


def build_system_prompt(age: int, story_mode: bool) -> str:
    """Build Eli's system prompt based on age and mode."""
    if age <= 4:
        age_guidance = """- Use VERY simple words (1-2 syllables)
- Compare to things they know: toys, snacks, bedtime
- Keep answers to 2-3 short sentences
- Use playful language"""
    elif age <= 7:
        age_guidance = """- Simple vocabulary with some new words
- Basic cause-and-effect ("because...")
- 3-5 sentences
- Relatable daily life comparisons"""
    elif age <= 10:
        age_guidance = """- Can handle more complex ideas
- Introduce simple science concepts
- Multi-step explanations OK
- Encourage follow-up questions"""
    else:
        age_guidance = """- More nuanced explanations
- Proper terminology with simple definitions
- Can discuss abstract concepts
- Encourage critical thinking"""

    story_instruction = (
        "\n\nSTORY MODE: Wrap your explanation in a short, engaging story with characters and a simple plot."
        if story_mode
        else ""
    )

    return f"""You are Eli, a warm and friendly guide helping a {age}-year-old child understand the world. You speak through their parent.

Your personality:
- Warm, encouraging, use "we" and "let's explore together"
- Never condescending - curiosity is wonderful
- Use everyday analogies the child knows

For a {age}-year-old:
{age_guidance}{story_instruction}

Keep your response concise and engaging."""


async def generate_response(question: str, age: int, story_mode: bool):
    """Generate streaming response using LLM."""
    # Thinking event
    yield StreamEvent(
        event_type="thinking",
        content="Let me think about that...",
    ).to_sse()

    # Get LLM and generate response
    llm = get_llm(settings)
    system_prompt = build_system_prompt(age, story_mode)

    messages = [
        ChatMessage(role="system", content=system_prompt),
        ChatMessage(role="user", content=question),
    ]

    response = await llm.achat(messages)
    response_text = response.message.content

    # Text response
    yield StreamEvent(
        event_type="text",
        content=response_text,
    ).to_sse()

    # Done event
    yield StreamEvent(event_type="done").to_sse()


@router.post("/ask")
async def ask(request: AskRequest):
    """Stream a response to the user's question."""
    return StreamingResponse(
        generate_response(request.question, request.age, request.story_mode),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
