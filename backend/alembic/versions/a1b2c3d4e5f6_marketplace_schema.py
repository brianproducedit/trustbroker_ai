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
    op.execute("ALTER TYPE contractstatus ADD VALUE IF NOT EXISTS 'OPEN'")
    op.execute("ALTER TYPE contractstatus ADD VALUE IF NOT EXISTS 'AWARDED'")

    op.add_column(
        "profiles",
        sa.Column("headline", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.add_column("profiles", sa.Column("bio", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column(
        "profiles",
        sa.Column("skills", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False),
    )
    op.add_column(
        "profiles",
        sa.Column("portfolio", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False),
    )
    op.add_column(
        "profiles",
        sa.Column("paypal_payout_email", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.add_column(
        "profiles",
        sa.Column(
            "primary_workspace",
            sqlmodel.sql.sqltypes.AutoString(),
            server_default="client",
            nullable=False,
        ),
    )
    op.add_column(
        "profiles",
        sa.Column("profile_completeness", sa.Integer(), server_default="0", nullable=False),
    )

    op.add_column(
        "contracts",
        sa.Column(
            "visibility",
            sqlmodel.sql.sqltypes.AutoString(),
            server_default="private_draft",
            nullable=False,
        ),
    )
    op.add_column(
        "contracts",
        sa.Column("required_skills", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False),
    )
    op.add_column("contracts", sa.Column("opens_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True))
    op.create_index(op.f("ix_contracts_visibility"), "contracts", ["visibility"], unique=False)

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
        sa.ForeignKeyConstraint(["milestone_id"], ["milestones.id"]),
        sa.ForeignKeyConstraint(["freelancer_id"], ["profiles.id"]),
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
    op.drop_index(op.f("ix_payouts_idempotency_key"), table_name="payouts")
    op.drop_index(op.f("ix_payouts_status"), table_name="payouts")
    op.drop_index(op.f("ix_payouts_paypal_item_id"), table_name="payouts")
    op.drop_index(op.f("ix_payouts_paypal_batch_id"), table_name="payouts")
    op.drop_index(op.f("ix_payouts_freelancer_id"), table_name="payouts")
    op.drop_index(op.f("ix_payouts_milestone_id"), table_name="payouts")
    op.drop_index(op.f("ix_payouts_contract_id"), table_name="payouts")
    op.drop_index(op.f("ix_payouts_id"), table_name="payouts")
    op.drop_table("payouts")

    op.drop_index(op.f("ix_notifications_type"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")

    op.drop_index(op.f("ix_vetting_reports_application_id"), table_name="vetting_reports")
    op.drop_index(op.f("ix_vetting_reports_id"), table_name="vetting_reports")
    op.drop_table("vetting_reports")

    op.drop_index(op.f("ix_applications_status"), table_name="applications")
    op.drop_index(op.f("ix_applications_freelancer_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_contract_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_id"), table_name="applications")
    op.drop_table("applications")

    op.drop_index(op.f("ix_contracts_visibility"), table_name="contracts")
    op.drop_column("contracts", "opens_at")
    op.drop_column("contracts", "required_skills")
    op.drop_column("contracts", "visibility")

    op.drop_column("profiles", "profile_completeness")
    op.drop_column("profiles", "primary_workspace")
    op.drop_column("profiles", "paypal_payout_email")
    op.drop_column("profiles", "portfolio")
    op.drop_column("profiles", "skills")
    op.drop_column("profiles", "bio")
    op.drop_column("profiles", "headline")
