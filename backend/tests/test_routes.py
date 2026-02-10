"""Tests for API routes."""

import pytest


@pytest.mark.asyncio
async def test_root_endpoint(client):
    """Test the root endpoint returns welcome message."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to ELI5 Now!"
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test the health endpoint returns healthy status."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
