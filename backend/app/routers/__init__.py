from app.routers.health import router as health_router
from app.routers.contracts import router as contracts_router
from app.routers.payments import router as payments_router
from app.routers.deliveries import router as deliveries_router
from app.routers.ai import router as ai_router
from app.routers.audit import router as audit_router
from app.routers.listings import router as listings_router
from app.routers.applications import router as applications_router
from app.routers.notifications import router as notifications_router
from app.routers.profiles import router as profiles_router

__all__ = [
    "health_router",
    "contracts_router",
    "payments_router",
    "deliveries_router",
    "ai_router",
    "audit_router",
    "listings_router",
    "applications_router",
    "notifications_router",
    "profiles_router",
]
