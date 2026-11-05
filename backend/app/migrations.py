import logging
from sqlalchemy import inspect, text
from sqlmodel import SQLModel
# Ensure all models are imported into SQLModel metadata
import app.models.contract
import app.models.acceptance
import app.models.milestone
import app.models.delivery
import app.models.payment
import app.models.audit
import app.models.user
import app.models.verification
import app.models.marketplace

logger = logging.getLogger("trustbroker.migrations")


def run_auto_migrations(engine) -> None:
    """
    Idempotent database schema reconciliation executed during application startup.
    1. Creates any missing tables defined in SQLModel metadata.
    2. Ensures missing nullable/default columns are added via ALTER TABLE IF NOT EXISTS.
    """
    try:
        logger.info("[MIGRATION] Starting startup database schema check...")
        
        # 1. Create missing tables
        SQLModel.metadata.create_all(engine)
        
        dialect_name = engine.dialect.name
        
        # Specific known migrations for PostgreSQL
        if dialect_name == "postgresql":
            known_alters = [
                "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);",
                "ALTER TABLE contract_versions ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);",
                "ALTER TABLE contract_acceptances ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);",
                "ALTER TABLE contract_acceptances ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);",
                "ALTER TABLE contract_acceptances ADD COLUMN IF NOT EXISTS user_agent VARCHAR(512);",
            ]
            with engine.begin() as conn:
                for stmt in known_alters:
                    try:
                        conn.execute(text(stmt))
                    except Exception as col_err:
                        logger.warning(f"[MIGRATION] Warning executing '{stmt}': {col_err}")

        # 2. General metadata reconciliation
        insp = inspect(engine)
        existing_tables = set(insp.get_table_names())
        
        for table_name, table in SQLModel.metadata.tables.items():
            if table_name not in existing_tables:
                continue
            
            existing_cols = {c["name"] for c in insp.get_columns(table_name)}
            for col in table.columns:
                if col.name not in existing_cols:
                    # Column is defined in model but missing from table
                    col_type = col.type.compile(engine.dialect)
                    nullable_clause = "" if col.nullable else " NOT NULL"
                    default_clause = ""
                    if col.server_default is not None:
                        default_clause = f" DEFAULT {col.server_default.arg}"
                    elif col.nullable:
                        default_clause = " DEFAULT NULL"

                    if dialect_name == "postgresql":
                        add_stmt = f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col.name}" {col_type}{default_clause};'
                    else:
                        add_stmt = f'ALTER TABLE "{table_name}" ADD COLUMN "{col.name}" {col_type}{default_clause};'
                    
                    try:
                        with engine.begin() as conn:
                            logger.info(f"[MIGRATION] Auto-adding missing column: {add_stmt}")
                            conn.execute(text(add_stmt))
                    except Exception as add_err:
                        logger.warning(f"[MIGRATION] Could not add column {table_name}.{col.name}: {add_err}")

        logger.info("[MIGRATION] Schema reconciliation completed successfully.")
    except Exception as exc:
        logger.error(f"[MIGRATION] Error during startup schema reconciliation: {exc}", exc_info=True)

