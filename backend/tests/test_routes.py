"""Tests for API routes."""

import pytest

from app.routes.ask import AskRequest


def test_ask_request_with_history():
    """Test AskRequest accepts conversation history."""
    request = AskRequest(
        question="Why?",
        history=[
            {"role": "user", "content": "Why is the sky blue?"},
            {"role": "assistant", "content": "Because of how light scatters!"},
        ],
    )
    assert request.question == "Why?"
    assert len(request.history) == 2
    assert request.history[0]["role"] == "user"
    assert request.history[1]["role"] == "assistant"


def test_ask_request_defaults():
    """Test AskRequest has correct defaults."""
    request = AskRequest(question="Test")
    assert request.age == 5
    assert request.story_mode is False
    assert request.history == []


@pytest.mark.asyncio
async def test_root_endpoint(client):
    """Test the root endpoint returns welcome message."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to ELI5 Now!"
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test the health endpoint returns healthy status."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_build_messages_with_token_limit_no_history():
    """Test message building with empty history."""
    from app.routes.ask import build_messages_with_token_limit

    messages = build_messages_with_token_limit(
        system_prompt="You are Eli.",
        history=[],
        current_question="Why is the sky blue?",
    )

    assert len(messages) == 2  # system + question
    assert messages[0].role == "system"
    assert messages[0].content == "You are Eli."
    assert messages[1].role == "user"
    assert messages[1].content == "Why is the sky blue?"


def test_build_messages_with_token_limit_with_history():
    """Test message building includes history."""
    from app.routes.ask import build_messages_with_token_limit

    history = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
    ]

    messages = build_messages_with_token_limit(
        system_prompt="You are Eli.",
        history=history,
        current_question="How are you?",
    )

    assert len(messages) == 4  # system + 2 history + question
    assert messages[0].role == "system"
    assert messages[1].role == "user"
    assert messages[1].content == "Hello"
    assert messages[2].role == "assistant"
    assert messages[2].content == "Hi there!"
    assert messages[3].role == "user"
    assert messages[3].content == "How are you?"


def test_build_messages_with_token_limit_trims_old_messages():
    """Test that old messages are trimmed when exceeding token limit."""
    from app.routes.ask import build_messages_with_token_limit

    # Create history with many messages
    history = [
        {"role": "user", "content": f"Message {i} " * 50}  # ~100 tokens each
        for i in range(20)
    ]

    messages = build_messages_with_token_limit(
        system_prompt="Short prompt.",
        history=history,
        current_question="Final question?",
        max_total_tokens=500,  # Very limited budget
        response_buffer=100,
    )

    # Should have trimmed most history
    assert len(messages) < 22  # Less than system + 20 history + question
    assert messages[0].role == "system"
    assert messages[-1].role == "user"
    assert messages[-1].content == "Final question?"


def test_build_messages_preserves_recent_messages():
    """Test that most recent messages are kept, oldest dropped."""
    from app.routes.ask import build_messages_with_token_limit

    history = [
        {"role": "user", "content": "Old message " * 100},  # Large, should be dropped
        {"role": "assistant", "content": "Old response " * 100},
        {"role": "user", "content": "Recent message"},  # Small, should be kept
        {"role": "assistant", "content": "Recent response"},
    ]

    messages = build_messages_with_token_limit(
        system_prompt="Eli.",
        history=history,
        current_question="New question",
        max_total_tokens=300,
        response_buffer=50,
    )

    # Recent messages should be present
    contents = [m.content for m in messages]
    assert "Recent message" in contents
    assert "Recent response" in contents
    assert "New question" in contents
