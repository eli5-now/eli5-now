"""Messages related to conversation history and formatting for Agent input."""

from typing import Literal

from pydantic import BaseModel


class HistoryMessage(BaseModel):
    """A message in conversation history."""

    role: Literal["user", "assistant"]
    content: str
