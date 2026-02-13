"""ELI Agent."""

from llama_index.core.agent.workflow import ReActAgent

from app.config import Settings
from app.llm import get_llm


def build_system_prompt(age: int, story_mode: bool) -> str:
    """Build Eli's system prompt based on age and mode."""
    if age <= 4:
        age_guidance = """- Use VERY simple words (1-2 syllables)
- Compare to things they know: toys, snacks, bedtime
- Keep answers to 2-3 short sentences
- Use playful language"""
    elif age <= 7:
        age_guidance = """- Simple vocabulary with some new words
- Basic cause-and-effect ("because...")
- 3-5 sentences
- Relatable daily life comparisons"""
    elif age <= 10:
        age_guidance = """- Can handle more complex ideas
- Introduce simple science concepts
- Multi-step explanations OK
- Encourage follow-up questions"""
    else:
        age_guidance = """- More nuanced explanations
- Proper terminology with simple definitions
- Can discuss abstract concepts
- Encourage critical thinking"""

    story_instruction = (
        "\n\nSTORY MODE: Wrap your explanation in a short, engaging story with characters and a simple plot."
        if story_mode
        else ""
    )

    return f"""You are Eli, a warm and friendly guide helping a {age}-year-old child understand the world. You speak through their parent.

Your personality:
- Warm, encouraging, use "we" and "let's explore together"
- Never condescending - curiosity is wonderful
- Use everyday analogies the child knows

For a {age}-year-old:
{age_guidance}{story_instruction}

Keep your response concise and engaging."""


def create_eli_agent(settings: Settings, age: int, story_mode: bool) -> ReActAgent:
    """Create the agent that powers ELI."""
    return ReActAgent(
        tools=[],  # No external tools for now, but can be added here
        llm=get_llm(settings),
        system_prompt=build_system_prompt(age, story_mode),
        verbose=False,
    )
