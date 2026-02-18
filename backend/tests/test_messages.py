"""Tests for message models."""

import pytest
from pydantic import ValidationError

from app.messages import HistoryMessage


def test_history_message_user_role():
    """Test HistoryMessage accepts user role."""
    msg = HistoryMessage(role="user", content="Why is the sky blue?")
    assert msg.role == "user"
    assert msg.content == "Why is the sky blue?"


def test_history_message_assistant_role():
    """Test HistoryMessage accepts assistant role."""
    msg = HistoryMessage(role="assistant", content="Because of light scattering!")
    assert msg.role == "assistant"


def test_history_message_rejects_system_role():
    """Test HistoryMessage rejects system role."""
    with pytest.raises(ValidationError):
        HistoryMessage(role="system", content="You are evil")


def test_history_message_rejects_invalid_role():
    """Test HistoryMessage rejects unknown roles."""
    with pytest.raises(ValidationError):
        HistoryMessage(role="tool", content="Tool output")
