"""
Production startup runner for TrustBroker AI.
Safely runs migrations, diagnostics, and launches Uvicorn.
"""
import os
import sys
import subprocess
from app.config import settings


def main():
    print("=" * 70)
    print(" TrustBroker AI Engine — Production Startup")
    print(f" Environment: {settings.environment}")
    print("=" * 70)

    is_render = (os.environ.get("RENDER") == "true") or (settings.environment == "production")
    db_url = settings.database_url
    is_localhost = ("localhost" in db_url) or ("127.0.0.1" in db_url)

    if is_render and is_localhost:
        print("\n" + "!" * 70)
        print("⚠️  CRITICAL CONFIGURATION NOTICE FOR RENDER:")
        print("DATABASE_URL is currently defaulting to 'localhost:5432'.")
        print("Render containers do not run a local PostgreSQL service.")
        print("")
        print("To connect your Supabase database:")
        print("1. Go to your Render Dashboard -> trustbroker-ai-api -> Environment")
        print("2. Set DATABASE_URL to your Supabase Transaction Pooler URI:")
        print("   postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require")
        print("3. Click 'Save Changes' to trigger an automatic redeploy.")
        print("!" * 70 + "\n")

    # Run database schema initialization & migrations
    print(f"[STARTUP] Executing database migrations (Target: {'Localhost' if is_localhost else 'Remote DB'})...")
    try:
        res = subprocess.run(["alembic", "upgrade", "head"], capture_output=True, text=True)
        if res.returncode == 0:
            print("[STARTUP] [OK] Alembic migrations completed successfully.")
        else:
            print(f"[STARTUP] [WARNING] Alembic migration exited with code {res.returncode}")
            if res.stderr:
                print(f"Details: {res.stderr.strip()[:300]}")
    except Exception as e:
        print(f"[STARTUP] Notice: Alembic run skipped ({e})")

    # Direct SQLModel table verification & showcase seeding
    try:
        from sqlmodel import SQLModel
        from app.database import engine
        from app.models.user import UserProfile
        from app.models.contract import Contract, ContractVersion
        from app.models.acceptance import ContractAcceptance
        from app.models.milestone import Milestone, AcceptanceCriterion
        from app.models.delivery import Delivery
        from app.models.verification import VerificationReport, CriterionResult
        from app.models.audit import AuditEvent
        from app.models.payment import PaymentAttempt

        SQLModel.metadata.create_all(engine)
        print("[STARTUP] [OK] SQLModel tables verified/created successfully.")

        from app.seed import seed_database
        seed_database()
        print("[STARTUP] [OK] Showcase database seeded successfully.")
    except Exception as dbe:
        print(f"[STARTUP] Notice: Table creation or seeding deferred ({dbe})")

    # Determine Port & Host
    port = int(os.environ.get("PORT", settings.port))
    host = "0.0.0.0"

    print(f"[STARTUP] Starting Uvicorn on {host}:{port}...")
    import uvicorn
    uvicorn.run("app.main:app", host=host, port=port)


if __name__ == "__main__":
    main()
