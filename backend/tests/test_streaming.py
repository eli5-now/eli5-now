"""Tests for streaming events."""

import json

from app.streaming import StreamEvent


def test_stream_event_to_sse_basic():
    """Test StreamEvent formats correctly as SSE."""
    event = StreamEvent(event_type="text", content="Hello world")
    sse = event.to_sse()

    assert sse.startswith("data: ")
    assert sse.endswith("\n\n")

    # Parse the JSON data
    data = json.loads(sse[6:-2])
    assert data["type"] == "text"
    assert data["content"] == "Hello world"


def test_stream_event_to_sse_with_metadata():
    """Test StreamEvent includes metadata when provided."""
    event = StreamEvent(
        event_type="image",
        content="https://example.com/image.png",
        metadata={"alt": "A blue sky"},
    )
    sse = event.to_sse()
    data = json.loads(sse[6:-2])

    assert data["type"] == "image"
    assert data["metadata"]["alt"] == "A blue sky"


def test_stream_event_done():
    """Test done event has empty content."""
    event = StreamEvent(event_type="done")
    sse = event.to_sse()
    data = json.loads(sse[6:-2])

    assert data["type"] == "done"
    assert data["content"] == ""
