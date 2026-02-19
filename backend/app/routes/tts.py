"""Synthesize speech using OpenAI TTS."""

import functools
import logging

import openai
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)


@functools.lru_cache(maxsize=1)
def _get_tts_client() -> AsyncOpenAI:
    """Return the shared AsyncOpenAI client, constructed once per process."""
    return AsyncOpenAI(api_key=settings.stt_api_key)


@router.post("/tts")
async def synthesize(request: TTSRequest) -> Response:
    """Synthesize speech from text using OpenAI TTS."""
    if not settings.stt_api_key:
        raise HTTPException(
            status_code=503,
            detail="TTS is not configured. Set STT_API_KEY on the server.",
        )

    try:
        response = await _get_tts_client().audio.speech.create(
            model="tts-1",
            voice="nova",
            input=request.text,
        )
    except openai.OpenAIError as exc:
        logger.exception("OpenAI TTS failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="TTS service unavailable. Please try again.",
        ) from exc

    return Response(content=response.content, media_type="audio/mpeg")
