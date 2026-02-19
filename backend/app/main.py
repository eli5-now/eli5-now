"""FastAPI application for ELI5 Now!"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.ask import router as ask_router
from app.routes.transcribe import router as transcribe_router
from app.routes.tts import router as tts_router

app = FastAPI(
    title="ELI5 Now!",
    description="AI-powered explanations for curious children",
    version="0.1.0",
)

# CORS: Allow frontend to call backend from browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask_router)
app.include_router(transcribe_router)
app.include_router(tts_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to ELI5 Now!", "status": "ok"}


@app.get("/health")
async def health():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}
