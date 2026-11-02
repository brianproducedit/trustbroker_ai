import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings

logger = logging.getLogger("trustbroker.api")

from app.routers import (
    health_router,
    contracts_router,
    payments_router,
    deliveries_router,
    ai_router,
    audit_router,
    listings_router,
    applications_router,
    notifications_router,
    profiles_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation or connection checks
    yield
    # Shutdown cleanups



app = FastAPI(
    title="TrustBroker AI Engine",
    description="Trust layer between clients and freelancers: open contracts, applications, PayPal-secured milestone payments and AI verification.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception on %s %s: %s", request.method, request.url.path, exc)
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )

# Include API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(health_router, prefix=api_v1_prefix)
app.include_router(contracts_router, prefix=api_v1_prefix)
app.include_router(payments_router, prefix=api_v1_prefix)
app.include_router(deliveries_router, prefix=api_v1_prefix)
app.include_router(ai_router, prefix=api_v1_prefix)
app.include_router(audit_router, prefix=api_v1_prefix)
app.include_router(listings_router, prefix=api_v1_prefix)
app.include_router(applications_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)
app.include_router(profiles_router, prefix=api_v1_prefix)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "TrustBroker AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
        "ping": "/ping",
    }


@app.get("/ping", tags=["Root"])
def ping():
    return {
        "ping": "pong",
        "service": "TrustBroker AI API",
        "database": "PostgreSQL (Local)" if "localhost" in settings.database_url or "127.0.0.1" in settings.database_url else "PostgreSQL (Remote)",
    }
