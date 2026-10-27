"""application portfolio_snapshot

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-10-27 11:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if "applications" in insp.get_table_names():
        app_cols = {c["name"] for c in insp.get_columns("applications")}
        if "portfolio_snapshot" not in app_cols:
            op.add_column(
                "applications",
                sa.Column("portfolio_snapshot", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False),
            )


def downgrade() -> None:
    pass
