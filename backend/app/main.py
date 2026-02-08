"""FastAPI application for ELI5 Now!"""

from fastapi import FastAPI

app = FastAPI(
    title="ELI5 Now!",
    description="AI-powered explanations for curious children",
    version="0.1.0",
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to ELI5 Now!", "status": "ok"}


@app.get("/health")
async def health():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}
