"""SSE event definitions."""

from dataclasses import dataclass, field
from typing import Literal


@dataclass
class StreamEvent:
    """A server-sent event for streaming responses."""

    event_type: Literal["thinking", "text", "image", "done"]
    content: str = ""
    metadata: dict = field(default_factory=dict)

    def to_sse(self) -> str:
        """Format as SSE message."""
        import json

        data = {
            "type": self.event_type,
            "content": self.content,
        }
        if self.metadata:
            data["metadata"] = self.metadata

        return f"data: {json.dumps(data)}\n\n"
