from app.routers.health import router as health_router
from app.routers.contracts import router as contracts_router
from app.routers.payments import router as payments_router
from app.routers.deliveries import router as deliveries_router
from app.routers.ai import router as ai_router
from app.routers.audit import router as audit_router

__all__ = [
    "health_router",
    "contracts_router",
    "payments_router",
    "deliveries_router",
    "ai_router",
    "audit_router",
]
