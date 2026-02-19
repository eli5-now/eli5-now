"""Transcribe audio files using OpenAI's Whisper or the Web Speech API."""

from fastapi import APIRouter, UploadFile
from openai import AsyncOpenAI

from app.config import settings

router = APIRouter()


@router.post("/transcribe")
async def transcribe(audio: UploadFile):
    """Transcribe an audio file."""
    client = AsyncOpenAI(api_key=settings.tts_api_key)
    transcript = await client.audio.transcriptions.create(
        model="whisper-1", file=(audio.filename, await audio.read(), audio.content_type)
    )
    return {"transcript": transcript.text}
