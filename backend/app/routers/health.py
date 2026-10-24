from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", summary="System Health Check")
def get_health():
    """Returns the operational status, current environment, and UTC timestamp."""
    return {
        "status": "ok",
        "service": "trustbroker-ai-api",
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "configured",
    }
