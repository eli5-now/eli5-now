# ELI5 Now!

![Backend Coverage](https://img.shields.io/badge/backend%20coverage-66%25-yellow)
![Python](https://img.shields.io/badge/python-3.12+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> "No Question Unanswered!" - AI-powered explanations for curious children.

A Progressive Web App that helps parents explain the world to their children using AI. Features a friendly guide named **Eli** who provides age-appropriate explanations, stories, and visual aids.

## Project Structure

```
eli5-now/
├── backend/          # Python FastAPI + LlamaIndex
└── frontend/         # Next.js + TypeScript + Tailwind
```

## Development

### Backend

```bash
cd backend
uv sync --group api --group dev --group llm
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend

```bash
cd backend
uv run pytest              # Run tests with coverage
uv run pytest -v           # Verbose output
uv run pytest --cov-report=html  # Generate HTML coverage report
```

## License

MIT
