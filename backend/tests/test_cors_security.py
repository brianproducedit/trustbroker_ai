"""
Automated Security Tests for CORS Policy & Error Handling.
Ensures:
1. Approved origins receive CORS headers.
2. Unapproved/arbitrary origins (e.g. evil.com) do NOT receive Access-Control-Allow-Origin.
3. 500 error responses do NOT reflect arbitrary Origin headers with credentials.
4. Internal exception details are masked in production.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings


@pytest.fixture
def client():
    # Add a temporary route that raises an exception to test 500 error handling
    @app.get("/api/v1/test-error-endpoint")
    def trigger_error():
        raise RuntimeError("SensitiveDatabaseConnectionError: password=supersecret at /var/app/db.py")

    return TestClient(app, raise_server_exceptions=False)


def test_approved_origin_receives_cors_headers(client):
    """Approved origin (localhost frontend) receives Access-Control-Allow-Origin."""
    response = client.get(
        "/ping",
        headers={"Origin": "http://localhost:5173"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_render_frontend_origin_matches_regex(client):
    """Render frontend hostname matches regex and receives CORS headers."""
    response = client.get(
        "/ping",
        headers={"Origin": "https://trustbroker-ai-frontend-bx9a.onrender.com"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://trustbroker-ai-frontend-bx9a.onrender.com"


def test_unapproved_origin_receives_no_cors_headers(client):
    """Arbitrary / malicious origin does NOT receive Access-Control-Allow-Origin."""
    response = client.get(
        "/ping",
        headers={"Origin": "https://evil.com"}
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_500_error_does_not_reflect_arbitrary_origin(client):
    """500 error response does NOT reflect an unapproved Origin header."""
    response = client.get(
        "/api/v1/test-error-endpoint",
        headers={"Origin": "https://attacker.evil.com"}
    )
    assert response.status_code == 500
    # Must NOT reflect the attacker origin
    assert response.headers.get("access-control-allow-origin") != "https://attacker.evil.com"
    assert "access-control-allow-origin" not in response.headers


def test_500_error_production_masks_exception_details(client, monkeypatch):
    """In production mode, 500 errors must not leak internal exception text or secrets."""
    monkeypatch.setattr(settings, "environment", "production")
    response = client.get(
        "/api/v1/test-error-endpoint",
        headers={"Origin": "http://localhost:5173"}
    )
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data
    assert "SensitiveDatabaseConnectionError" not in data["detail"]
    assert "supersecret" not in data["detail"]
    assert "error_id" in data

