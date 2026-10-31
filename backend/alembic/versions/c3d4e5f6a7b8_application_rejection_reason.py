"""application rejection_reason

Revision ID: c3d4e5f6a7b8
Revises: b7c8d9e0f1a2
Create Date: 2026-10-31 03:06:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if "applications" in insp.get_table_names():
        app_cols = {c["name"] for c in insp.get_columns("applications")}
        if "rejection_reason" not in app_cols:
            op.add_column(
                "applications",
                sa.Column("rejection_reason", sa.Text(), nullable=True),
            )


def downgrade() -> None:
    pass
