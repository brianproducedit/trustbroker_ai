"""marketplace schema: open contracts, applications, notifications, payouts

Revision ID: a1b2c3d4e5f6
Revises: f081cc3b0317
Create Date: 2026-10-27 10:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f081cc3b0317"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())

    # Add Enum values safely
    op.execute("ALTER TYPE contractstatus ADD VALUE IF NOT EXISTS 'OPEN'")
    op.execute("ALTER TYPE contractstatus ADD VALUE IF NOT EXISTS 'AWARDED'")

    # Columns for profiles
    if "profiles" in existing_tables:
        profile_cols = {c["name"] for c in insp.get_columns("profiles")}
        if "headline" not in profile_cols:
            op.add_column("profiles", sa.Column("headline", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if "bio" not in profile_cols:
            op.add_column("profiles", sa.Column("bio", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if "skills" not in profile_cols:
            op.add_column("profiles", sa.Column("skills", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False))
        if "portfolio" not in profile_cols:
            op.add_column("profiles", sa.Column("portfolio", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False))
        if "paypal_payout_email" not in profile_cols:
            op.add_column("profiles", sa.Column("paypal_payout_email", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if "primary_workspace" not in profile_cols:
            op.add_column("profiles", sa.Column("primary_workspace", sqlmodel.sql.sqltypes.AutoString(), server_default="client", nullable=False))
        if "profile_completeness" not in profile_cols:
            op.add_column("profiles", sa.Column("profile_completeness", sa.Integer(), server_default="0", nullable=False))

    # Columns for contracts
    if "contracts" in existing_tables:
        contract_cols = {c["name"] for c in insp.get_columns("contracts")}
        if "visibility" not in contract_cols:
            op.add_column("contracts", sa.Column("visibility", sqlmodel.sql.sqltypes.AutoString(), server_default="private_draft", nullable=False))
            try:
                op.create_index(op.f("ix_contracts_visibility"), "contracts", ["visibility"], unique=False)
            except Exception:
                pass
        if "required_skills" not in contract_cols:
            op.add_column("contracts", sa.Column("required_skills", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False))
        if "opens_at" not in contract_cols:
            op.add_column("contracts", sa.Column("opens_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True))

    # Table applications
    if "applications" not in existing_tables:
        op.create_table(
            "applications",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("contract_id", sa.Uuid(), nullable=False),
            sa.Column("freelancer_id", sa.Uuid(), nullable=False),
            sa.Column("cover_note", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("proposed_start", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column("status", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("created_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.Column("updated_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(["contract_id"], ["contracts.id"]),
            sa.ForeignKeyConstraint(["freelancer_id"], ["profiles.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("contract_id", "freelancer_id", name="uq_applications_contract_freelancer"),
        )
        op.create_index(op.f("ix_applications_id"), "applications", ["id"], unique=False)
        op.create_index(op.f("ix_applications_contract_id"), "applications", ["contract_id"], unique=False)
        op.create_index(op.f("ix_applications_freelancer_id"), "applications", ["freelancer_id"], unique=False)
        op.create_index(op.f("ix_applications_status"), "applications", ["status"], unique=False)

    # Table vetting_reports
    if "vetting_reports" not in existing_tables:
        op.create_table(
            "vetting_reports",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("application_id", sa.Uuid(), nullable=False),
            sa.Column("score", sa.Integer(), nullable=False),
            sa.Column("recommendation", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("reasons", sa.JSON(), nullable=False),
            sa.Column("model_used", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("created_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(["application_id"], ["applications.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_vetting_reports_id"), "vetting_reports", ["id"], unique=False)
        op.create_index(op.f("ix_vetting_reports_application_id"), "vetting_reports", ["application_id"], unique=True)

    # Table notifications
    if "notifications" not in existing_tables:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("user_id", sa.Uuid(), nullable=False),
            sa.Column("type", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("title", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("body", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("entity_type", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column("entity_id", sa.Uuid(), nullable=True),
            sa.Column("read_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True),
            sa.Column("created_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["profiles.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)
        op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)
        op.create_index(op.f("ix_notifications_type"), "notifications", ["type"], unique=False)

    # Table payouts
    if "payouts" not in existing_tables:
        op.create_table(
            "payouts",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("contract_id", sa.Uuid(), nullable=False),
            sa.Column("milestone_id", sa.Uuid(), nullable=False),
            sa.Column("freelancer_id", sa.Uuid(), nullable=False),
            sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column("currency", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("paypal_batch_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column("paypal_item_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column("paypal_payout_email", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column("status", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("idempotency_key", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("created_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.Column("updated_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(["contract_id"], ["contracts.id"]),
            sa.ForeignKeyConstraint(["freelancer_id"], ["profiles.id"]),
            sa.ForeignKeyConstraint(["milestone_id"], ["milestones.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_payouts_id"), "payouts", ["id"], unique=False)
        op.create_index(op.f("ix_payouts_contract_id"), "payouts", ["contract_id"], unique=False)
        op.create_index(op.f("ix_payouts_milestone_id"), "payouts", ["milestone_id"], unique=False)
        op.create_index(op.f("ix_payouts_freelancer_id"), "payouts", ["freelancer_id"], unique=False)
        op.create_index(op.f("ix_payouts_paypal_batch_id"), "payouts", ["paypal_batch_id"], unique=False)
        op.create_index(op.f("ix_payouts_paypal_item_id"), "payouts", ["paypal_item_id"], unique=False)
        op.create_index(op.f("ix_payouts_status"), "payouts", ["status"], unique=False)
        op.create_index(op.f("ix_payouts_idempotency_key"), "payouts", ["idempotency_key"], unique=True)


def downgrade() -> None:
    pass
