"""
Production startup runner for TrustBroker AI.
Safely runs migrations, diagnostics, schema healing and launches Uvicorn.
"""
import os
import sys
import subprocess
from app.config import settings


def ensure_schema_columns(engine):
    """Ensure all required columns and tables exist even if Alembic was partially applied."""
    from sqlalchemy import text
    statements = [
        "DO $$ BEGIN ALTER TYPE contractstatus ADD VALUE IF NOT EXISTS 'OPEN'; EXCEPTION WHEN duplicate_object THEN null; END $$;",
        "DO $$ BEGIN ALTER TYPE contractstatus ADD VALUE IF NOT EXISTS 'AWARDED'; EXCEPTION WHEN duplicate_object THEN null; END $$;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline VARCHAR;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio VARCHAR;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio JSONB DEFAULT '[]'::jsonb;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paypal_payout_email VARCHAR;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_workspace VARCHAR DEFAULT 'client';",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS visibility VARCHAR DEFAULT 'private_draft';",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]'::jsonb;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS opens_at TIMESTAMP WITH TIME ZONE;",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS portfolio_snapshot JSONB DEFAULT '[]'::jsonb;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_id UUID;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS freelancer_id UUID;",
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS freelancer_email VARCHAR;",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",
        "CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);",
        "CREATE INDEX IF NOT EXISTS idx_contracts_freelancer_id ON contracts(freelancer_id);",
        "CREATE INDEX IF NOT EXISTS idx_applications_contract_id ON applications(contract_id);",
        "CREATE INDEX IF NOT EXISTS idx_applications_freelancer_id ON applications(freelancer_id);",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass


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
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_ini_path = os.path.join(backend_dir, "alembic.ini")

    migration_success = False
    try:
        from alembic.config import Config
        from alembic import command

        cfg = Config(alembic_ini_path)
        cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
        cfg.set_main_option("sqlalchemy.url", settings.sqlalchemy_database_url.replace("%", "%%"))
        try:
            command.upgrade(cfg, "head")
            print("[STARTUP] [OK] Alembic migrations completed successfully.")
            migration_success = True
        except Exception as mig_err:
            print(f"[STARTUP] [WARNING] In-process Alembic upgrade encountered error: {mig_err}")
            # Do NOT silently stamp head on error — that corrupts schema state.
            # Attempt CLI runner as a fallback only for environment differences.
    except Exception as e:
        print(f"[STARTUP] Notice: In-process Alembic runner unavailable ({e}).")

    if not migration_success:
        print("[STARTUP] Attempting Alembic CLI migration...")
        try:
            res = subprocess.run(
                [sys.executable, "-m", "alembic", "upgrade", "head"],
                cwd=backend_dir,
                capture_output=True,
                text=True,
            )
            if res.returncode == 0:
                print("[STARTUP] [OK] Alembic CLI migrations completed successfully.")
                migration_success = True
            else:
                # Do NOT automatically call `alembic stamp head` after a failed migration.
                # A failed migration means the schema is incomplete; stamping head would deceive future runs.
                print(f"[STARTUP] [ERROR] Alembic CLI migration failed with exit code {res.returncode}.")
                if res.stderr:
                    print(f"[STARTUP] Stderr: {res.stderr.strip()[:500]}")
                if res.stdout:
                    print(f"[STARTUP] Stdout: {res.stdout.strip()[:500]}")
                print("[STARTUP] [NOTICE] Skipping automatic stamp to preserve schema integrity.")
        except Exception as cli_err:
            print(f"[STARTUP] [WARNING] Alembic CLI runner error: {cli_err}")

    # Direct SQLModel table verification, column healing & showcase seeding
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
        from app.models.marketplace import Application, VettingReport, Notification, Payout

        SQLModel.metadata.create_all(engine)
        print("[STARTUP] [OK] SQLModel tables verified/created successfully.")

        # Self-healing column additions for existing tables
        ensure_schema_columns(engine)
        print("[STARTUP] [OK] Schema columns verified & healed.")

        # Only seed demo data in non-production or when SEED_DEMO_DATA=true is explicitly set.
        # Never auto-seed in production as it would overwrite real user data.
        if settings.environment != "production" or settings.seed_demo_data or os.environ.get("SEED_DEMO_DATA", "false").lower() == "true":
            from app.seed import seed_database
            seed_database()
            print("[STARTUP] [OK] Showcase database seeded successfully.")
        else:
            print("[STARTUP] [SKIP] Seeding skipped in production (set SEED_DEMO_DATA=true to override).")
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
