"""Application configuration."""

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

    # OpenAI settings
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # Anthropic settings
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"


# Singleton instance
settings = Settings()
