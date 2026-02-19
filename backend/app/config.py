"""Application configuration."""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM Provider: "openai" or "anthropic"
    llm_provider: str = "openai"

    # LLM settings
    llm_api_key: str = ""
    llm_model: str = "gpt-4o"

    # Max tokens for response (adjust as needed)
    max_tokens: int = 2048

    # Space reserved for response generation
    response_token_buffer: int = 1500

    stt_api_key: str | None = None

    @field_validator("response_token_buffer")
    @classmethod
    def validate_response_token_buffer(cls, v: int, info) -> int:
        """Ensure response_token_buffer is less than max_tokens."""
        max_tokens = info.data.get("max_tokens")
        if max_tokens is not None and v >= max_tokens:
            raise ValueError(
                f"response_token_buffer ({v}) must be less than max_tokens ({max_tokens})"
            )
        return v


# Singleton instance
settings = Settings()
