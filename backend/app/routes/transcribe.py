"""Transcribe audio files using OpenAI Whisper."""

import openai
from fastapi import APIRouter, HTTPException, UploadFile
from openai import AsyncOpenAI

from app.config import settings

router = APIRouter()

# 25 MB — matches OpenAI Whisper's own file size limit
_MAX_AUDIO_BYTES = 25 * 1024 * 1024

# Lazy singleton: constructed on first request so startup never fails when the
# key is absent (e.g. during tests that don't use this route).
_whisper_client: AsyncOpenAI | None = None


def _get_whisper_client() -> AsyncOpenAI:
    global _whisper_client
    if _whisper_client is None:
        _whisper_client = AsyncOpenAI(api_key=settings.stt_api_key or None)
    return _whisper_client


@router.post("/transcribe")
async def transcribe(audio: UploadFile) -> dict[str, str]:
    """Transcribe an audio file using OpenAI Whisper."""
    if not (audio.content_type or "").startswith("audio/"):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{audio.content_type}'. Expected an audio/* file.",
        )

    data = await audio.read()

    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    if len(data) > _MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Audio file exceeds the {_MAX_AUDIO_BYTES // (1024 * 1024)} MB limit.",
        )

    try:
        transcript = await _get_whisper_client().audio.transcriptions.create(
            model="whisper-1",
            file=(audio.filename or "recording", data, audio.content_type),
        )
    except openai.OpenAIError as exc:
        raise HTTPException(status_code=502, detail=f"Transcription service error: {exc}") from exc

    return {"transcript": transcript.text}
