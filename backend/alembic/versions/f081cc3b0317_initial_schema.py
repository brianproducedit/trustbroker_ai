"""initial_schema

Revision ID: f081cc3b0317
Revises: 
Create Date: 2026-10-24 16:55:15.864626

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'f081cc3b0317'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema idempotently."""
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())

    # Safely create PostgreSQL enum types
    try:
        op.execute("DO $$ BEGIN CREATE TYPE contractstatus AS ENUM ('DRAFT', 'PENDING_ACCEPTANCE', 'ACTIVE', 'IN_VERIFICATION', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
        op.execute("DO $$ BEGIN CREATE TYPE milestonestatus AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'VERIFIED', 'SETTLED', 'REVISION_REQUESTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
        op.execute("DO $$ BEGIN CREATE TYPE paymentstatus AS ENUM ('NOT_STARTED', 'CHECKOUT_CREATED', 'STAGED_IN_SANDBOX', 'RELEASE_AUTHORIZED', 'RELEASED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
        op.execute("DO $$ BEGIN CREATE TYPE criterionstatus AS ENUM ('PENDING', 'PASS', 'FAIL', 'NEEDS_REVIEW'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    except Exception:
        pass

    # Helper to safely check if index exists
    def index_exists(table_name: str, index_name: str) -> bool:
        if table_name not in existing_tables:
            return False
        try:
            indexes = insp.get_indexes(table_name)
            return any(idx.get("name") == index_name for idx in indexes)
        except Exception:
            return False

    # 1. profiles
    if 'profiles' not in existing_tables:
        op.create_table('profiles',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('email', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('full_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('organization', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.Column('updated_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('profiles', op.f('ix_profiles_email')):
        try:
            op.create_index(op.f('ix_profiles_email'), 'profiles', ['email'], unique=True)
        except Exception:
            pass
    if not index_exists('profiles', op.f('ix_profiles_id')):
        try:
            op.create_index(op.f('ix_profiles_id'), 'profiles', ['id'], unique=False)
        except Exception:
            pass

    # 2. provider_events
    if 'provider_events' not in existing_tables:
        op.create_table('provider_events',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('event_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('event_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('resource_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('payload', sa.JSON(), nullable=False),
            sa.Column('processed', sa.Boolean(), nullable=False),
            sa.Column('processed_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True),
            sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('provider_events', op.f('ix_provider_events_event_id')):
        try:
            op.create_index(op.f('ix_provider_events_event_id'), 'provider_events', ['event_id'], unique=True)
        except Exception:
            pass
    if not index_exists('provider_events', op.f('ix_provider_events_id')):
        try:
            op.create_index(op.f('ix_provider_events_id'), 'provider_events', ['id'], unique=False)
        except Exception:
            pass
    if not index_exists('provider_events', op.f('ix_provider_events_resource_id')):
        try:
            op.create_index(op.f('ix_provider_events_resource_id'), 'provider_events', ['resource_id'], unique=False)
        except Exception:
            pass

    # 3. contracts
    if 'contracts' not in existing_tables:
        op.create_table('contracts',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('category', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('current_version', sa.Integer(), nullable=False),
            sa.Column('status', sa.Enum('DRAFT', 'PENDING_ACCEPTANCE', 'ACTIVE', 'IN_VERIFICATION', 'COMPLETED', 'CANCELLED', name='contractstatus', create_type=False), nullable=False),
            sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('currency', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('staged_amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('released_amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('client_id', sa.Uuid(), nullable=False),
            sa.Column('freelancer_id', sa.Uuid(), nullable=True),
            sa.Column('freelancer_email', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.Column('updated_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['client_id'], ['profiles.id'], ),
            sa.ForeignKeyConstraint(['freelancer_id'], ['profiles.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('contracts', op.f('ix_contracts_client_id')):
        try:
            op.create_index(op.f('ix_contracts_client_id'), 'contracts', ['client_id'], unique=False)
        except Exception:
            pass
    if not index_exists('contracts', op.f('ix_contracts_code')):
        try:
            op.create_index(op.f('ix_contracts_code'), 'contracts', ['code'], unique=True)
        except Exception:
            pass
    if not index_exists('contracts', op.f('ix_contracts_freelancer_id')):
        try:
            op.create_index(op.f('ix_contracts_freelancer_id'), 'contracts', ['freelancer_id'], unique=False)
        except Exception:
            pass
    if not index_exists('contracts', op.f('ix_contracts_id')):
        try:
            op.create_index(op.f('ix_contracts_id'), 'contracts', ['id'], unique=False)
        except Exception:
            pass

    # 4. audit_events
    if 'audit_events' not in existing_tables:
        op.create_table('audit_events',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('contract_id', sa.Uuid(), nullable=True),
            sa.Column('actor_id', sa.Uuid(), nullable=True),
            sa.Column('actor_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('action', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('details', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('metadata_json', sa.JSON(), nullable=True),
            sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['actor_id'], ['profiles.id'], ),
            sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('audit_events', op.f('ix_audit_events_actor_id')):
        try:
            op.create_index(op.f('ix_audit_events_actor_id'), 'audit_events', ['actor_id'], unique=False)
        except Exception:
            pass
    if not index_exists('audit_events', op.f('ix_audit_events_contract_id')):
        try:
            op.create_index(op.f('ix_audit_events_contract_id'), 'audit_events', ['contract_id'], unique=False)
        except Exception:
            pass
    if not index_exists('audit_events', op.f('ix_audit_events_id')):
        try:
            op.create_index(op.f('ix_audit_events_id'), 'audit_events', ['id'], unique=False)
        except Exception:
            pass

    # 5. contract_acceptances
    if 'contract_acceptances' not in existing_tables:
        op.create_table('contract_acceptances',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('contract_id', sa.Uuid(), nullable=False),
            sa.Column('version_number', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=False),
            sa.Column('role', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('accepted_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('contract_acceptances', op.f('ix_contract_acceptances_contract_id')):
        try:
            op.create_index(op.f('ix_contract_acceptances_contract_id'), 'contract_acceptances', ['contract_id'], unique=False)
        except Exception:
            pass
    if not index_exists('contract_acceptances', op.f('ix_contract_acceptances_id')):
        try:
            op.create_index(op.f('ix_contract_acceptances_id'), 'contract_acceptances', ['id'], unique=False)
        except Exception:
            pass
    if not index_exists('contract_acceptances', op.f('ix_contract_acceptances_user_id')):
        try:
            op.create_index(op.f('ix_contract_acceptances_user_id'), 'contract_acceptances', ['user_id'], unique=False)
        except Exception:
            pass

    # 6. contract_versions
    if 'contract_versions' not in existing_tables:
        op.create_table('contract_versions',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('contract_id', sa.Uuid(), nullable=False),
            sa.Column('version_number', sa.Integer(), nullable=False),
            sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('sow_content', sa.JSON(), nullable=False),
            sa.Column('created_by', sa.Uuid(), nullable=True),
            sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
            sa.ForeignKeyConstraint(['created_by'], ['profiles.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('contract_versions', op.f('ix_contract_versions_contract_id')):
        try:
            op.create_index(op.f('ix_contract_versions_contract_id'), 'contract_versions', ['contract_id'], unique=False)
        except Exception:
            pass
    if not index_exists('contract_versions', op.f('ix_contract_versions_id')):
        try:
            op.create_index(op.f('ix_contract_versions_id'), 'contract_versions', ['id'], unique=False)
        except Exception:
            pass

    # 7. milestones
    if 'milestones' not in existing_tables:
        op.create_table('milestones',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('contract_id', sa.Uuid(), nullable=False),
            sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('currency', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('deadline', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'VERIFIED', 'SETTLED', 'REVISION_REQUESTED', name='milestonestatus', create_type=False), nullable=False),
            sa.Column('sort_order', sa.Integer(), nullable=False),
            sa.Column('payment_status', sa.Enum('NOT_STARTED', 'CHECKOUT_CREATED', 'STAGED_IN_SANDBOX', 'RELEASE_AUTHORIZED', 'RELEASED', 'CANCELLED', name='paymentstatus', create_type=False), nullable=False),
            sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.Column('updated_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('milestones', op.f('ix_milestones_contract_id')):
        try:
            op.create_index(op.f('ix_milestones_contract_id'), 'milestones', ['contract_id'], unique=False)
        except Exception:
            pass
    if not index_exists('milestones', op.f('ix_milestones_id')):
        try:
            op.create_index(op.f('ix_milestones_id'), 'milestones', ['id'], unique=False)
        except Exception:
            pass

    # 8. acceptance_criteria
    if 'acceptance_criteria' not in existing_tables:
        op.create_table('acceptance_criteria',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('milestone_id', sa.Uuid(), nullable=False),
            sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('evidence_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('status', sa.Enum('PENDING', 'PASS', 'FAIL', 'NEEDS_REVIEW', name='criterionstatus', create_type=False), nullable=False),
            sa.Column('ai_confidence', sa.Float(), nullable=True),
            sa.Column('evidence_match_snippet', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('feedback', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['milestone_id'], ['milestones.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('acceptance_criteria', op.f('ix_acceptance_criteria_id')):
        try:
            op.create_index(op.f('ix_acceptance_criteria_id'), 'acceptance_criteria', ['id'], unique=False)
        except Exception:
            pass
    if not index_exists('acceptance_criteria', op.f('ix_acceptance_criteria_milestone_id')):
        try:
            op.create_index(op.f('ix_acceptance_criteria_milestone_id'), 'acceptance_criteria', ['milestone_id'], unique=False)
        except Exception:
            pass

    # 9. deliveries
    if 'deliveries' not in existing_tables:
        op.create_table('deliveries',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('contract_id', sa.Uuid(), nullable=False),
            sa.Column('milestone_id', sa.Uuid(), nullable=False),
            sa.Column('submitted_by', sa.Uuid(), nullable=False),
            sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('repo_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('live_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('version', sa.Integer(), nullable=False),
            sa.Column('submitted_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
            sa.ForeignKeyConstraint(['milestone_id'], ['milestones.id'], ),
            sa.ForeignKeyConstraint(['submitted_by'], ['profiles.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('deliveries', op.f('ix_deliveries_contract_id')):
        try:
            op.create_index(op.f('ix_deliveries_contract_id'), 'deliveries', ['contract_id'], unique=False)
        except Exception:
            pass
    if not index_exists('deliveries', op.f('ix_deliveries_id')):
        try:
            op.create_index(op.f('ix_deliveries_id'), 'deliveries', ['id'], unique=False)
        except Exception:
            pass
    if not index_exists('deliveries', op.f('ix_deliveries_milestone_id')):
        try:
            op.create_index(op.f('ix_deliveries_milestone_id'), 'deliveries', ['milestone_id'], unique=False)
        except Exception:
            pass
    if not index_exists('deliveries', op.f('ix_deliveries_submitted_by')):
        try:
            op.create_index(op.f('ix_deliveries_submitted_by'), 'deliveries', ['submitted_by'], unique=False)
        except Exception:
            pass

    # 10. payment_attempts
    if 'payment_attempts' not in existing_tables:
        op.create_table('payment_attempts',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('contract_id', sa.Uuid(), nullable=False),
            sa.Column('milestone_id', sa.Uuid(), nullable=True),
            sa.Column('paypal_order_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('paypal_capture_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
            sa.Column('currency', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('status', sa.Enum('NOT_STARTED', 'CHECKOUT_CREATED', 'STAGED_IN_SANDBOX', 'RELEASE_AUTHORIZED', 'RELEASED', 'CANCELLED', name='paymentstatus', create_type=False), nullable=False),
            sa.Column('paypal_status', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('payer_email', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('created_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.Column('updated_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
            sa.ForeignKeyConstraint(['milestone_id'], ['milestones.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('payment_attempts', op.f('ix_payment_attempts_contract_id')):
        try:
            op.create_index(op.f('ix_payment_attempts_contract_id'), 'payment_attempts', ['contract_id'], unique=False)
        except Exception:
            pass
    if not index_exists('payment_attempts', op.f('ix_payment_attempts_id')):
        try:
            op.create_index(op.f('ix_payment_attempts_id'), 'payment_attempts', ['id'], unique=False)
        except Exception:
            pass
    if not index_exists('payment_attempts', op.f('ix_payment_attempts_milestone_id')):
        try:
            op.create_index(op.f('ix_payment_attempts_milestone_id'), 'payment_attempts', ['milestone_id'], unique=False)
        except Exception:
            pass
    if not index_exists('payment_attempts', op.f('ix_payment_attempts_paypal_capture_id')):
        try:
            op.create_index(op.f('ix_payment_attempts_paypal_capture_id'), 'payment_attempts', ['paypal_capture_id'], unique=False)
        except Exception:
            pass
    if not index_exists('payment_attempts', op.f('ix_payment_attempts_paypal_order_id')):
        try:
            op.create_index(op.f('ix_payment_attempts_paypal_order_id'), 'payment_attempts', ['paypal_order_id'], unique=False)
        except Exception:
            pass

    # 11. delivery_files
    if 'delivery_files' not in existing_tables:
        op.create_table('delivery_files',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('delivery_id', sa.Uuid(), nullable=False),
            sa.Column('file_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('storage_path', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('size_bytes', sa.Integer(), nullable=False),
            sa.Column('mime_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('uploaded_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('delivery_files', op.f('ix_delivery_files_delivery_id')):
        try:
            op.create_index(op.f('ix_delivery_files_delivery_id'), 'delivery_files', ['delivery_id'], unique=False)
        except Exception:
            pass
    if not index_exists('delivery_files', op.f('ix_delivery_files_id')):
        try:
            op.create_index(op.f('ix_delivery_files_id'), 'delivery_files', ['id'], unique=False)
        except Exception:
            pass

    # 12. verification_reports
    if 'verification_reports' not in existing_tables:
        op.create_table('verification_reports',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('delivery_id', sa.Uuid(), nullable=False),
            sa.Column('contract_id', sa.Uuid(), nullable=False),
            sa.Column('milestone_id', sa.Uuid(), nullable=False),
            sa.Column('overall_score', sa.Integer(), nullable=False),
            sa.Column('passed', sa.Boolean(), nullable=False),
            sa.Column('summary_analysis', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('model_used', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('requires_human_review', sa.Boolean(), nullable=False),
            sa.Column('assessed_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
            sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], ),
            sa.ForeignKeyConstraint(['milestone_id'], ['milestones.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('verification_reports', op.f('ix_verification_reports_contract_id')):
        try:
            op.create_index(op.f('ix_verification_reports_contract_id'), 'verification_reports', ['contract_id'], unique=False)
        except Exception:
            pass
    if not index_exists('verification_reports', op.f('ix_verification_reports_delivery_id')):
        try:
            op.create_index(op.f('ix_verification_reports_delivery_id'), 'verification_reports', ['delivery_id'], unique=False)
        except Exception:
            pass
    if not index_exists('verification_reports', op.f('ix_verification_reports_id')):
        try:
            op.create_index(op.f('ix_verification_reports_id'), 'verification_reports', ['id'], unique=False)
        except Exception:
            pass
    if not index_exists('verification_reports', op.f('ix_verification_reports_milestone_id')):
        try:
            op.create_index(op.f('ix_verification_reports_milestone_id'), 'verification_reports', ['milestone_id'], unique=False)
        except Exception:
            pass

    # 13. criterion_results
    if 'criterion_results' not in existing_tables:
        op.create_table('criterion_results',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('report_id', sa.Uuid(), nullable=False),
            sa.Column('criterion_id', sa.Uuid(), nullable=False),
            sa.Column('passed', sa.Boolean(), nullable=False),
            sa.Column('score', sa.Integer(), nullable=False),
            sa.Column('explanation', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('assessed_at', sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
            sa.ForeignKeyConstraint(['criterion_id'], ['acceptance_criteria.id'], ),
            sa.ForeignKeyConstraint(['report_id'], ['verification_reports.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    if not index_exists('criterion_results', op.f('ix_criterion_results_criterion_id')):
        try:
            op.create_index(op.f('ix_criterion_results_criterion_id'), 'criterion_results', ['criterion_id'], unique=False)
        except Exception:
            pass
    if not index_exists('criterion_results', op.f('ix_criterion_results_id')):
        try:
            op.create_index(op.f('ix_criterion_results_id'), 'criterion_results', ['id'], unique=False)
        except Exception:
            pass
    if not index_exists('criterion_results', op.f('ix_criterion_results_report_id')):
        try:
            op.create_index(op.f('ix_criterion_results_report_id'), 'criterion_results', ['report_id'], unique=False)
        except Exception:
            pass


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = set(insp.get_table_names())

    tables_to_drop = [
        'criterion_results',
        'verification_reports',
        'delivery_files',
        'payment_attempts',
        'deliveries',
        'acceptance_criteria',
        'milestones',
        'contract_versions',
        'contract_acceptances',
        'audit_events',
        'contracts',
        'provider_events',
        'profiles',
    ]
    for tbl in tables_to_drop:
        if tbl in existing_tables:
            try:
                op.drop_table(tbl)
            except Exception:
                pass
