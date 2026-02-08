# ELI5 Now!

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
uv sync --group api --group dev
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## License

MIT
