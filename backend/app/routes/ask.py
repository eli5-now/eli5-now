"""Ask endpoint for streaming Q&A."""

from typing import Literal

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from llama_index.core.llms import ChatMessage
from pydantic import BaseModel, Field
from tiktoken import encoding_for_model

from app.config import settings
from app.llm import get_llm
from app.streaming import StreamEvent

router = APIRouter()


class HistoryMessage(BaseModel):
    """A message in conversation history."""

    role: Literal["user", "assistant"]
    content: str


class AskRequest(BaseModel):
    """Request body for /ask endpoint."""

    question: str
    age: int = 5
    story_mode: bool = False
    history: list[HistoryMessage] = Field(default_factory=list)


def build_messages_with_token_limit(
    system_prompt: str,
    history: list[HistoryMessage],
    current_question: str,
    max_total_tokens: int,
    response_buffer: int,
    model: str,
) -> list[ChatMessage]:
    """Build messages list, trimming history to fit token budget."""
    encoder = encoding_for_model(model)

    # Calculate fixed token costs
    system_tokens = len(encoder.encode(system_prompt))
    question_tokens = len(encoder.encode(current_question))

    # History budget = total - system - question - response buffer
    history_budget = max_total_tokens - system_tokens - question_tokens - response_buffer

    # Trim history in pairs (user + assistant) to preserve conversation structure
    # Process from most recent, keeping pairs together
    pairs: list[tuple[HistoryMessage, HistoryMessage | None]] = []
    history_tokens = 0
    i = len(history) - 1

    while i >= 1:
        assistant_msg = history[i]
        user_msg = history[i - 1]
        pair_tokens = len(encoder.encode(user_msg.content)) + len(
            encoder.encode(assistant_msg.content)
        )
        if history_tokens + pair_tokens > history_budget:
            break
        pairs.append((user_msg, assistant_msg))
        history_tokens += pair_tokens
        i -= 2

    # Handle odd leading user message if it fits
    if i == 0:
        user_msg = history[0]
        msg_tokens = len(encoder.encode(user_msg.content))
        if history_tokens + msg_tokens <= history_budget:
            pairs.append((user_msg, None))

    # Flatten pairs back to message list (reversed to restore chronological order)
    trimmed_history = []
    for user_msg, assistant_msg in reversed(pairs):
        trimmed_history.append(user_msg)
        if assistant_msg:
            trimmed_history.append(assistant_msg)

    return [
        ChatMessage(role="system", content=system_prompt),
        *[ChatMessage(role=m.role, content=m.content) for m in trimmed_history],
        ChatMessage(role="user", content=current_question),
    ]


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


async def generate_response(
    question: str, history: list[HistoryMessage], age: int, story_mode: bool
):
    """Generate streaming response using LLM."""
    # Thinking event
    yield StreamEvent(
        event_type="thinking",
        content="Let me think about that...",
    ).to_sse()

    # Get LLM and generate response
    llm = get_llm(settings)
    system_prompt = build_system_prompt(age, story_mode)

    messages = build_messages_with_token_limit(
        system_prompt=system_prompt,
        history=history,
        current_question=question,
        max_total_tokens=settings.max_tokens,
        response_buffer=settings.response_token_buffer,
        model=settings.llm_model,
    )

    response = await llm.achat(messages)
    response_text = response.message.content

    # Text response
    yield StreamEvent(
        event_type="text",
        content=response_text or "",
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
