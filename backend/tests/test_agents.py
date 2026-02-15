"""Tests for agent creation and system prompts."""

from app.agents.eli import build_system_prompt


def test_build_system_prompt_young_child():
    """Test system prompt for very young children (<=4)."""
    prompt = build_system_prompt(age=3, story_mode=False)

    assert "3-year-old" in prompt
    assert "VERY simple words" in prompt
    assert "toys, snacks, bedtime" in prompt


def test_build_system_prompt_early_elementary():
    """Test system prompt for early elementary age (5-7)."""
    prompt = build_system_prompt(age=6, story_mode=False)

    assert "6-year-old" in prompt
    assert "Simple vocabulary" in prompt
    assert "cause-and-effect" in prompt


def test_build_system_prompt_late_elementary():
    """Test system prompt for late elementary age (8-10)."""
    prompt = build_system_prompt(age=9, story_mode=False)

    assert "9-year-old" in prompt
    assert "complex ideas" in prompt
    assert "science concepts" in prompt


def test_build_system_prompt_older_child():
    """Test system prompt for older children (>10)."""
    prompt = build_system_prompt(age=12, story_mode=False)

    assert "12-year-old" in prompt
    assert "nuanced explanations" in prompt
    assert "critical thinking" in prompt


def test_build_system_prompt_story_mode_off():
    """Test system prompt without story mode."""
    prompt = build_system_prompt(age=5, story_mode=False)

    assert "STORY MODE" not in prompt


def test_build_system_prompt_story_mode_on():
    """Test system prompt with story mode enabled."""
    prompt = build_system_prompt(age=5, story_mode=True)

    assert "STORY MODE" in prompt
    assert "engaging story" in prompt
    assert "characters" in prompt


def test_build_system_prompt_contains_eli_personality():
    """Test system prompt includes Eli's core personality."""
    prompt = build_system_prompt(age=5, story_mode=False)

    assert "Eli" in prompt
    assert "warm" in prompt.lower()
    assert "encouraging" in prompt
