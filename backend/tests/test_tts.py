"""Tests for the /tts endpoint."""

from unittest.mock import AsyncMock, MagicMock, patch

import openai
import pytest

from app.config import settings as app_settings


@pytest.fixture(autouse=True)
def stt_api_key_set(monkeypatch):
    """Provide a dummy STT key so the key-present guard doesn't block other tests."""
    monkeypatch.setattr(app_settings, "stt_api_key", "test-key")


def _make_speech_response(audio_bytes: bytes = b"fake-mp3-data") -> MagicMock:
    mock = MagicMock()
    mock.content = audio_bytes
    return mock


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_tts_returns_audio(client):
    """Happy path: valid text returns audio/mpeg content."""
    with patch("app.routes.tts._get_tts_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.speech.create = AsyncMock(
            return_value=_make_speech_response(b"fake-mp3-data")
        )
        mock_get_client.return_value = mock_client

        response = await client.post("/tts", json={"text": "Why is the sky blue?"})

    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert response.content == b"fake-mp3-data"


@pytest.mark.asyncio
async def test_tts_passes_nova_voice(client):
    """Verify the nova voice is used."""
    with patch("app.routes.tts._get_tts_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.speech.create = AsyncMock(
            return_value=_make_speech_response()
        )
        mock_get_client.return_value = mock_client

        await client.post("/tts", json={"text": "Hello!"})

        mock_client.audio.speech.create.assert_called_once_with(
            model="tts-1",
            voice="nova",
            input="Hello!",
        )


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_tts_rejects_empty_text(client):
    """Empty text must be rejected with 422."""
    response = await client.post("/tts", json={"text": ""})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_tts_rejects_text_over_limit(client):
    """Text exceeding 4096 characters must be rejected with 422."""
    response = await client.post("/tts", json={"text": "a" * 4097})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_tts_accepts_text_at_limit(client):
    """Text of exactly 4096 characters should be accepted."""
    with patch("app.routes.tts._get_tts_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.speech.create = AsyncMock(
            return_value=_make_speech_response()
        )
        mock_get_client.return_value = mock_client

        response = await client.post("/tts", json={"text": "a" * 4096})

    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Missing API key
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_tts_returns_503_when_key_not_set(client, monkeypatch):
    """A missing STT_API_KEY must return 503."""
    monkeypatch.setattr(app_settings, "stt_api_key", None)

    response = await client.post("/tts", json={"text": "Hello!"})

    assert response.status_code == 503
    assert "STT_API_KEY" in response.json()["detail"]


# ---------------------------------------------------------------------------
# OpenAI error handling
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_tts_returns_502_on_openai_error(client):
    """An OpenAI API failure must surface as 502."""
    with patch("app.routes.tts._get_tts_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.audio.speech.create = AsyncMock(
            side_effect=openai.APIStatusError(
                "rate limit",
                response=MagicMock(status_code=429, headers={}),
                body=None,
            )
        )
        mock_get_client.return_value = mock_client

        response = await client.post("/tts", json={"text": "Hello!"})

    assert response.status_code == 502
    assert "TTS service unavailable" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Singleton client
# ---------------------------------------------------------------------------

def test_get_tts_client_returns_same_instance():
    """_get_tts_client() must return the same object on repeated calls."""
    import app.routes.tts as mod
    from unittest.mock import patch, MagicMock

    mod._get_tts_client.cache_clear()

    with patch("app.routes.tts.AsyncOpenAI") as MockOpenAI:
        MockOpenAI.return_value = MagicMock()
        first = mod._get_tts_client()
        second = mod._get_tts_client()

    assert first is second
    MockOpenAI.assert_called_once()
