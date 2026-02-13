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

    def reducer(acc: str, msg: HistoryMessage) -> str:
        """Format each message based on role."""
        if msg.role == "user":
            return acc + f"Child asked: {msg.content}\n"
        else:
            return acc + f"You answered: {msg.content}\n"

    return reduce(reducer, history, "Previous conversation:\n") if history else ""
