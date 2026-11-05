import logging
from sqlalchemy import inspect, text
from sqlmodel import SQLModel
import app.models.contract
import app.models.acceptance
import app.models.milestone
import app.models.delivery
import app.models.payment
import app.models.audit
import app.models.user
import app.models.verification
import app.models.marketplace
from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migration")

def apply_migrations():
    logger.info("Starting schema reconciliation...")
    
    # 1. Ensure any missing tables are created
    SQLModel.metadata.create_all(engine)
    
    # 2. Add missing columns with IF NOT EXISTS
    alter_statements = [
        "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);",
        "ALTER TABLE contract_versions ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);",
        "ALTER TABLE contract_acceptances ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);",
        "ALTER TABLE contract_acceptances ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);",
        "ALTER TABLE contract_acceptances ADD COLUMN IF NOT EXISTS user_agent VARCHAR(512);",
    ]
    
    with engine.begin() as conn:
        for stmt in alter_statements:
            logger.info("Executing: %s", stmt)
            conn.execute(text(stmt))
            
    logger.info("Migration statements executed successfully.")
    
    # 3. Verify
    insp = inspect(engine)
    for t in ["contracts", "contract_versions", "contract_acceptances"]:
        cols = [c["name"] for c in insp.get_columns(t)]
        logger.info("Verified table '%s' columns: %s", t, cols)

if __name__ == "__main__":
    apply_migrations()

