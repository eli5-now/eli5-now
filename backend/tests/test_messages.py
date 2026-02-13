"""Tests for message formatting."""

from app.messages import HistoryMessage, format_history_for_agent


def test_format_history_empty():
    """Test formatting empty history returns empty string."""
    assert format_history_for_agent([]) == ""


def test_format_history_single_user_message():
    """Test formatting a single user message."""
    history = [HistoryMessage(role="user", content="Why is the sky blue?")]
    result = format_history_for_agent(history)

    assert "Previous conversation:" in result
    assert "Child asked: Why is the sky blue?" in result


def test_format_history_user_and_assistant():
    """Test formatting user and assistant messages."""
    history = [
        HistoryMessage(role="user", content="Why is the sky blue?"),
        HistoryMessage(role="assistant", content="Because of light scattering!"),
    ]
    result = format_history_for_agent(history)

    assert "Previous conversation:" in result
    assert "Child asked: Why is the sky blue?" in result
    assert "You answered: Because of light scattering!" in result


def test_format_history_multiple_turns():
    """Test formatting multiple conversation turns."""
    history = [
        HistoryMessage(role="user", content="Question 1"),
        HistoryMessage(role="assistant", content="Answer 1"),
        HistoryMessage(role="user", content="Question 2"),
        HistoryMessage(role="assistant", content="Answer 2"),
    ]
    result = format_history_for_agent(history)

    assert result.count("Child asked:") == 2
    assert result.count("You answered:") == 2
