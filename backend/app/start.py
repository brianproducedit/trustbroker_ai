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

    # Run database migrations
    print(f"[STARTUP] Executing database migrations (Target: {'Localhost' if is_localhost else 'Remote DB'})...")
    try:
        res = subprocess.run(["alembic", "upgrade", "head"], capture_output=True, text=True)
        if res.returncode == 0:
            print("[STARTUP] [OK] Alembic migrations completed successfully.")
            # Optionally seed demo contracts if database is fresh
            try:
                from app.seed import seed_database
                seed_database()
            except Exception as se:
                print(f"[STARTUP] Notice: Seeding skipped ({se})")
        else:
            print(f"[STARTUP] [WARNING] Alembic migration exited with code {res.returncode}")
            if res.stderr:
                print(f"Details: {res.stderr.strip()[:300]}")
            if is_render and is_localhost:
                print("[STARTUP] Continuing startup so FastAPI can boot and serve status...")
            else:
                print("[STARTUP] Continuing startup with existing schema...")
    except Exception as e:
        print(f"[STARTUP] Warning running alembic: {e}")

    # Determine Port & Host
    port = int(os.environ.get("PORT", settings.port))
    host = "0.0.0.0"

    print(f"[STARTUP] Starting Uvicorn on {host}:{port}...")
    import uvicorn
    uvicorn.run("app.main:app", host=host, port=port)


if __name__ == "__main__":
    main()
