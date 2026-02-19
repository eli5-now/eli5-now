"""Tests for the /transcribe endpoint."""

import io
from unittest.mock import AsyncMock, MagicMock, patch

import openai
import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _audio_bytes(size: int = 1024, content_type: str = "audio/webm") -> tuple[bytes, str]:
    """Return a minimal fake audio payload and its MIME type."""
    return b"0" * size, content_type


def _make_transcription_response(text: str) -> MagicMock:
    mock = MagicMock()
    mock.text = text
    return mock


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_transcribe_returns_transcript(client):
    """Happy path: valid audio returns the Whisper transcript."""
    data, content_type = _audio_bytes()

    with patch(
        "app.routes.transcribe._get_whisper_client"
    ) as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(
            return_value=_make_transcription_response("Why is the sky blue?")
        )
        mock_get_client.return_value = mock_client

        response = await client.post(
            "/transcribe",
            files={"audio": ("recording.webm", io.BytesIO(data), content_type)},
        )

    assert response.status_code == 200
    assert response.json() == {"transcript": "Why is the sky blue?"}


@pytest.mark.asyncio
async def test_transcribe_accepts_mp4_audio(client):
    """Safari produces audio/mp4; the endpoint should accept it."""
    data, content_type = _audio_bytes(content_type="audio/mp4")

    with patch("app.routes.transcribe._get_whisper_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(
            return_value=_make_transcription_response("Hello")
        )
        mock_get_client.return_value = mock_client

        response = await client.post(
            "/transcribe",
            files={"audio": ("recording.mp4", io.BytesIO(data), content_type)},
        )

    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Content-type validation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_transcribe_rejects_non_audio_content_type(client):
    """Files with a non-audio MIME type must be rejected with 415."""
    data = b"fake image data"
    response = await client.post(
        "/transcribe",
        files={"audio": ("photo.jpg", io.BytesIO(data), "image/jpeg")},
    )
    assert response.status_code == 415
    assert "Unsupported media type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_transcribe_rejects_text_content_type(client):
    """Plain text must be rejected."""
    response = await client.post(
        "/transcribe",
        files={"audio": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
    )
    assert response.status_code == 415


# ---------------------------------------------------------------------------
# File size validation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_transcribe_rejects_oversized_file(client):
    """Files larger than 25 MB must be rejected with 413."""
    oversized = b"0" * (25 * 1024 * 1024 + 1)
    response = await client.post(
        "/transcribe",
        files={"audio": ("big.webm", io.BytesIO(oversized), "audio/webm")},
    )
    assert response.status_code == 413
    assert "MB limit" in response.json()["detail"]


@pytest.mark.asyncio
async def test_transcribe_accepts_file_at_size_limit(client):
    """A file exactly at 25 MB should be accepted (boundary check)."""
    exactly_limit = b"0" * (25 * 1024 * 1024)

    with patch("app.routes.transcribe._get_whisper_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(
            return_value=_make_transcription_response("")
        )
        mock_get_client.return_value = mock_client

        response = await client.post(
            "/transcribe",
            files={"audio": ("max.webm", io.BytesIO(exactly_limit), "audio/webm")},
        )

    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Empty file
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_transcribe_rejects_empty_file(client):
    """An empty audio file must be rejected with 400."""
    response = await client.post(
        "/transcribe",
        files={"audio": ("empty.webm", io.BytesIO(b""), "audio/webm")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# OpenAI error handling
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_transcribe_returns_502_on_openai_error(client):
    """An OpenAI API failure must surface as 502, not 500."""
    data, content_type = _audio_bytes()

    with patch("app.routes.transcribe._get_whisper_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(
            side_effect=openai.APIStatusError(
                "rate limit exceeded",
                response=MagicMock(status_code=429, headers={}),
                body=None,
            )
        )
        mock_get_client.return_value = mock_client

        response = await client.post(
            "/transcribe",
            files={"audio": ("recording.webm", io.BytesIO(data), content_type)},
        )

    assert response.status_code == 502
    assert "Transcription service unavailable" in response.json()["detail"]


@pytest.mark.asyncio
async def test_transcribe_returns_502_on_connection_error(client):
    """A network error reaching OpenAI must also surface as 502."""
    data, content_type = _audio_bytes()

    with patch("app.routes.transcribe._get_whisper_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.transcriptions.create = AsyncMock(
            side_effect=openai.APIConnectionError(request=MagicMock())
        )
        mock_get_client.return_value = mock_client

        response = await client.post(
            "/transcribe",
            files={"audio": ("recording.webm", io.BytesIO(data), content_type)},
        )

    assert response.status_code == 502


# ---------------------------------------------------------------------------
# Singleton client
# ---------------------------------------------------------------------------

def test_get_whisper_client_returns_same_instance():
    """_get_whisper_client() must return the same object on repeated calls (lru_cache)."""
    import app.routes.transcribe as mod

    # Clear the lru_cache so this test is independent of call order
    mod._get_whisper_client.cache_clear()

    with patch("app.routes.transcribe.AsyncOpenAI") as MockOpenAI:
        MockOpenAI.return_value = MagicMock()
        first = mod._get_whisper_client()
        second = mod._get_whisper_client()

    assert first is second
    MockOpenAI.assert_called_once()  # constructed only once
