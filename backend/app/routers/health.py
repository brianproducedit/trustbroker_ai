from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlmodel import Session, text
from app.config import settings
from app.database import get_session

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", summary="System Health & Database Ping")
def get_health(session: Session = Depends(get_session)):
    """Pings local server and PostgreSQL database to verify real operational status."""
    db_status = "connected"
    is_local_db = "localhost" in settings.database_url or "127.0.0.1" in settings.database_url
    
    try:
        session.exec(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": "trustbroker-ai-api",
        "environment": settings.environment,
        "database": db_status,
        "database_type": "PostgreSQL (Local)" if is_local_db else "PostgreSQL (Remote)",
        "server_host": f"http://localhost:{settings.port}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ping", summary="Quick Server Ping")
def ping():
    """Ultra-fast ping endpoint for frontend connection probes."""
    return {"ping": "pong", "server": f"http://localhost:{settings.port}", "environment": settings.environment}

