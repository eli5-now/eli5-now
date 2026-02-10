"""LLM factory for provider switching."""

from llama_index.core.llms import LLM
from llama_index.llms.anthropic import Anthropic
from llama_index.llms.openai import OpenAI

from app.config import Settings


def get_llm(settings: Settings) -> LLM:
    """Create an LLM instance based on configuration."""
    if settings.llm_provider == "anthropic":
        return Anthropic(
            model=settings.anthropic_model,
            api_key=settings.anthropic_api_key,
        )

    # Default to OpenAI
    return OpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
    )
