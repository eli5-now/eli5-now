# AGENTS.md - Development Guidelines for AI Assistants

This file contains crucial instructions and context for AI coding assistants working on the ELI5 Now! project.

## Project Overview

**ELI5 Now!** ("Explain Like I'm 5 - Now!") is an AI-powered app helping parents explain the world to curious children. The friendly guide **Eli** provides age-appropriate explanations, stories, and visual aids.

- **Motto**: "No Question Unanswered!"
- **First users**: Developer's 4-year-old son and family
- **Goal**: Non-profit, family-friendly educational tool

## Architecture

```
Single POST /ask endpoint
         │
         ▼
LlamaIndex ReActAgent (built-in)
         │
         ├─ Generates explanations directly (no tool needed)
         ├─ generate_image() tool - DALL-E (when visuals help)
         └─ generate_speech() tool - TTS (Phase 2)
         │
         ▼
Streaming SSE response with "thinking" updates
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend | FastAPI + LlamaIndex | Python-heavy for easier debugging by developer |
| Frontend | Next.js + TypeScript | Minimal TS, crucial for UX |
| LLM | OpenAI (default) / Anthropic (configurable) | Start with existing OpenAI key |
| Agent | LlamaIndex ReActAgent (built-in) | Don't reinvent the wheel |
| Tools | Only for external APIs | LLM generates text directly, no tool overhead |
| Endpoint | Single `/ask` | Orchestrator decides what's needed |

## Critical Development Rules

### 1. Explain Before Changing

**Before making any code changes, briefly explain what you're about to do** (1-2 sentences). The developer wants to understand each change before it happens.

Example:
> "I'm adding the MessageList component to page.tsx with mock conversation data so you can see the message bubbles in action."

### 2. Small, Incremental Changes (MOST IMPORTANT)

**Every PR must be:**
- **Small**: <200 lines of code changed ideally, max 400
- **Focused**: One feature or fix per PR
- **Testable**: Clear "How to Test" instructions
- **Reviewable**: Can be understood in <10 minutes

**If a feature is too big, split it:**
```
"Add chat interface" becomes:
├── PR #1: Empty page with header (10 lines)
├── PR #2: Message bubble component (40 lines)
├── PR #3: Message list with mock data (50 lines)
├── PR #4: Chat input component (60 lines)
└── PR #5: Wire up streaming API (80 lines)
```

### 2. UI-First Implementation

Each PR should be **visually testable**. The developer will test by opening the app and verifying the feature works.

### 3. Testing Requirements

**Every feature branch must include appropriate tests.**

#### Backend (pytest)
- Test files in `backend/tests/`
- Use `pytest-asyncio` for async tests
- Run with: `cd backend && uv run pytest`

```python
# Example: tests/test_routes.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

#### Frontend (Jest + React Testing Library)
- Test files in `frontend/__tests__/` or co-located with components
- Run with: `cd frontend && npm test`

```typescript
// Example: __tests__/components/MessageBubble.test.tsx
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/MessageBubble';

test('renders user message on the right', () => {
  render(<MessageBubble role="user" content="Hello" />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

#### What to Test
- **Routes**: Request/response, error handling
- **Components**: Rendering, user interactions, props
- **Utilities**: Edge cases, error conditions

#### PR Requirements
- Include "How to Test" section in PR description
- All tests must pass before merge

### 4. Package Management

- **Backend**: `uv` with `pyproject.toml` (following datagent patterns)
- **Frontend**: `npm` with standard Next.js setup

## Tech Stack Details

### Backend (Python)

```
backend/
├── app/
│   ├── main.py           # FastAPI app
│   ├── config.py         # Settings (LLM provider toggle)
│   ├── llm.py            # LLM factory (OpenAI/Anthropic)
│   ├── agents/           # ReActAgent setup
│   ├── routes/           # API endpoints
│   ├── streaming/        # SSE events
│   └── models/           # Pydantic models
├── tests/
├── pyproject.toml
└── uv.lock
```

### Frontend (TypeScript/Next.js)

```
frontend/
├── app/                  # Routes & layouts only
├── components/           # UI components
├── hooks/                # Custom React hooks
├── lib/                  # API client, utilities
├── types/                # TypeScript definitions
└── __tests__/            # Jest tests
```

### Frontend Best Practices

1. **Server vs Client Components**: Default to Server Components, use `'use client'` only for interactive components
2. **Type Safety**: No `any` types, explicit interfaces for all props
3. **Styling**: Tailwind CSS only, design tokens via CSS variables
4. **Accessibility**: Proper focus states, ARIA labels

## Code Patterns to Follow

### Reference Codebase

The datagent project at `/Users/lmn/code/sme-assistant/datagent` serves as a reference for:
- Streaming infrastructure (`streaming.py`)
- Agent factory patterns (`base/factory.py`)
- Decorator patterns (`base/tools.py`)
- pyproject.toml structure

### LLM Provider Switching

```python
# backend/app/llm.py
def get_llm(settings: Settings):
    if settings.llm_provider == "anthropic":
        return Anthropic(model=settings.anthropic_model)
    return OpenAI(model=settings.openai_model)
```

### Streaming Events

```python
@dataclass
class StreamEvent:
    event_type: Literal["thinking", "text", "image", "audio", "done"]
    content: str
    stage: Optional[str] = None
    metadata: Optional[dict] = None
```

## Features by Phase

### Phase 1: Foundation (Current)
- Backend skeleton with FastAPI
- Frontend with Next.js + Tailwind
- Basic chat UI with mock data
- SSE streaming infrastructure

### Phase 2: Core Agent
- LlamaIndex ReActAgent integration
- LLM provider switching
- Age-adaptive prompts
- Thinking/reasoning display

### Phase 3: Features
- Age selector, story mode toggle
- Eli avatar
- localStorage persistence
- Soft/rounded theme

### Phase 4: Enhancements
- DALL-E image generation
- Feedback buttons (👍📈📉)
- Feedback storage

### Phase 5: Persistence & Deploy
- SQLite database
- Conversation storage
- Railway + Vercel deployment

### Future (Backlog)
- Web search tool for current events
- Multiple Eli avatar choices
- Voice input (Whisper)
- Text-to-speech (Narrator)
- User accounts

## Commit Guidelines

### Commit Frequently

**Make commits regularly on small, coherent changes** - NOT once per PR or once per issue.

Why:
- Easier to undo specific changes if something breaks
- Easier to review past changes
- Better git history for understanding what changed and when
- Smaller commits = less risk per commit

Example for "Add chat input component":
```
git commit -m "feat: Add ChatInput component skeleton"
# ... more work ...
git commit -m "feat: Add input field styling to ChatInput"
# ... more work ...
git commit -m "feat: Add send button to ChatInput"
# ... more work ...
git commit -m "feat: Wire up onSubmit handler in ChatInput"
```

### Commit Message Format

```
feat: Short description (#issue-number)

- Bullet point of what changed
- Another change

## How to Test
1. Step to test
2. Another step
3. Expected result
```

### Important: No AI Attribution

**Do NOT add Co-Authored-By or any AI attribution to commits.** Keep commit messages clean and professional.

### Addressing PR Review Comments

When addressing PR review comments:
- **Make one commit per comment addressed** (where a change is needed)
- This makes it easy for the reviewer to verify each comment was addressed
- Use clear commit messages that reference what was changed

## Git Workflow

**Always use feature branches and PRs** - never push directly to main.

### Workflow for Each Issue

```bash
# 1. Start from latest main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b issue-N-short-description

# 3. Make small commits frequently
git add <files>
git commit -m "feat: Description of small change"

# 4. Push and create PR
git push -u origin issue-N-short-description
gh pr create --title "feat: Title (#N)" --body "..."

# 5. After PR is approved and merged
git checkout main
git pull origin main
git branch -d issue-N-short-description
```

### Branch Naming

Format: `issue-N-short-description`

Examples:
- `issue-1-backend-skeleton`
- `issue-5-chat-input-component`
- `issue-12-react-agent-setup`

## Important Context

- **Developer background**: ML researcher, Python expert, less familiar with TypeScript
- **First user**: 4-year-old child - UI must be child-friendly and intuitive
- **Budget**: $20-50/month for API costs
- **Timeline**: 3-4 weeks for MVP

## Collaboration Style

### Backend (Python)
**Guide, don't implement.** The developer wants to write Python backend code themselves. Your role:
1. Explain what needs to be done
2. Answer questions as they implement
3. Review their final code

### Frontend (TypeScript)
You may implement frontend code directly, as the developer is less familiar with TypeScript.

## GitHub Repository

- **Organization**: eli5-now
- **Repository**: eli5-now/eli5-now
- **URL**: https://github.com/eli5-now/eli5-now

## Plan File Location

Detailed implementation plan: `/Users/lmn/.claude/plans/crystalline-pondering-lake.md`
