"""Transcribe audio files using OpenAI Whisper."""

import functools
import logging
import openai
from fastapi import APIRouter, HTTPException, UploadFile
from openai import AsyncOpenAI

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# 25 MB — matches OpenAI Whisper's own file size limit
_MAX_AUDIO_BYTES = 25 * 1024 * 1024


@functools.lru_cache(maxsize=1)
def _get_whisper_client() -> AsyncOpenAI:
    """Return the shared AsyncOpenAI client, constructed once per process."""
    return AsyncOpenAI(api_key=settings.stt_api_key)


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
        logger.exception("OpenAI Whisper transcription failed: %s", exc)
        raise HTTPException(
            status_code=502, detail="Transcription service unavailable. Please try again."
        ) from exc

    return {"transcript": transcript.text}
