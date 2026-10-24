from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.routers import (
    health_router,
    contracts_router,
    payments_router,
    deliveries_router,
    ai_router,
    audit_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation or connection checks
    yield
    # Shutdown cleanups



app = FastAPI(
    title="TrustBroker AI Engine",
    description="Deterministic cross-border work verification, milestone escrow staging, and AI verification engine.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(health_router, prefix=api_v1_prefix)
app.include_router(contracts_router, prefix=api_v1_prefix)
app.include_router(payments_router, prefix=api_v1_prefix)
app.include_router(deliveries_router, prefix=api_v1_prefix)
app.include_router(ai_router, prefix=api_v1_prefix)
app.include_router(audit_router, prefix=api_v1_prefix)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "TrustBroker AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
