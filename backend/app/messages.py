"""Messages related to conversation history and formatting for Agent input."""

from functools import reduce
from typing import Literal

from pydantic import BaseModel


class HistoryMessage(BaseModel):
    """A message in conversation history."""

    role: Literal["user", "assistant"]
    content: str


def format_history_for_agent(history: list[HistoryMessage]) -> str:
    """Format history messages for Agent input."""
    return (
        reduce(
            lambda acc, msg: acc
            + (
                f"Child asked: {msg.content}\n"
                if msg.role == "user"
                else f"You answered: {msg.content}\n"
            ),
            history,
            "Previous conversation:\n",
        )
        if history
        else ""
    )
