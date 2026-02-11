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
