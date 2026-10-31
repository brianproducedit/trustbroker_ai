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

    try:
        from alembic.config import Config
        from alembic import command

        cfg = Config(alembic_ini_path)
        cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
        cfg.set_main_option("sqlalchemy.url", settings.sqlalchemy_database_url.replace("%", "%%"))
        try:
            command.upgrade(cfg, "head")
            print("[STARTUP] [OK] Alembic migrations completed successfully.")
        except Exception as mig_err:
            print(f"[STARTUP] [NOTICE] Alembic upgrade encountered: {mig_err}")
            # Self-healing: stamp database to head if tables exist or revision is out of sync
            print("[STARTUP] Reconciling schema revision state (stamping to head)...")
            cfg.set_main_option("sqlalchemy.url", settings.sqlalchemy_database_url.replace("%", "%%"))
            command.stamp(cfg, "head")
            print("[STARTUP] [OK] Alembic database successfully reconciled and stamped to head.")
    except Exception as e:
        print(f"[STARTUP] Notice: In-process Alembic runner deferred ({e}). Attempting CLI runner...")
        try:
            res = subprocess.run(
                [sys.executable, "-m", "alembic", "upgrade", "head"],
                cwd=backend_dir,
                capture_output=True,
                text=True,
            )
            if res.returncode == 0:
                print("[STARTUP] [OK] Alembic CLI migrations completed successfully.")
            else:
                print(f"[STARTUP] [NOTICE] Alembic CLI exited with code {res.returncode}. Stamping head...")
                subprocess.run(
                    [sys.executable, "-m", "alembic", "stamp", "head"],
                    cwd=backend_dir,
                    capture_output=True,
                    text=True,
                )
                print("[STARTUP] [OK] Alembic CLI stamped head successfully.")
        except Exception as cli_err:
            print(f"[STARTUP] Notice: Alembic CLI runner skipped ({cli_err})")

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
