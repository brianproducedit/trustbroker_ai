"""
Generates an all-in-one idempotent SQL setup script for Supabase.
Run this script to generate `supabase_setup.sql`.
"""
import uuid
import json
from decimal import Decimal
from datetime import datetime, timezone, timedelta

ELENA_ID = "35f8c21c-b5d7-4ca7-b4e4-151f3fcfedc2"
TARIRO_ID = "f907f77b-c340-4abe-8c12-a4606b8c2b15"

now = datetime.now(timezone.utc)

sql_parts = []

sql_parts.append("""-- =============================================================================
-- TrustBroker AI — Complete Supabase Database Setup & Showcase Seed Script
-- =============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- It creates all required enum types, tables, foreign keys, and indexes,
-- and seeds the showcase contracts linked to the real Supabase Auth users.
-- =============================================================================

-- 1. Create Enums (Idempotent)
DO $$ BEGIN
    CREATE TYPE contractstatus AS ENUM ('DRAFT', 'PENDING_ACCEPTANCE', 'ACTIVE', 'IN_VERIFICATION', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE milestonestatus AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'VERIFYING', 'VERIFIED', 'SETTLED', 'REVISION_REQUESTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE paymentstatus AS ENUM ('NOT_STARTED', 'CHECKOUT_CREATED', 'STAGED_IN_SANDBOX', 'RELEASE_AUTHORIZED', 'RELEASED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE criterionstatus AS ENUM ('PENDING', 'PASS', 'FAIL', 'NEEDS_REVIEW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    full_name VARCHAR NOT NULL,
    organization VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY,
    code VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    status contractstatus NOT NULL DEFAULT 'ACTIVE',
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'USD',
    staged_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    released_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    freelancer_email VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_versions (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    sow_content JSONB NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_acceptances (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'USD',
    deadline VARCHAR,
    status milestonestatus NOT NULL DEFAULT 'PENDING',
    sort_order INTEGER NOT NULL DEFAULT 0,
    payment_status paymentstatus NOT NULL DEFAULT 'NOT_STARTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS acceptance_criteria (
    id UUID PRIMARY KEY,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    evidence_type VARCHAR NOT NULL,
    status criterionstatus NOT NULL DEFAULT 'PENDING',
    ai_confidence FLOAT,
    evidence_match_snippet VARCHAR,
    feedback VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description VARCHAR NOT NULL,
    repo_url VARCHAR,
    live_url VARCHAR,
    version INTEGER NOT NULL DEFAULT 1,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_reports (
    id UUID PRIMARY KEY,
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    summary_analysis VARCHAR NOT NULL,
    model_used VARCHAR NOT NULL,
    requires_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS criterion_results (
    id UUID PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES verification_reports(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES acceptance_criteria(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    score INTEGER NOT NULL,
    explanation VARCHAR NOT NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    details VARCHAR NOT NULL,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_attempts (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    paypal_order_id VARCHAR,
    paypal_capture_id VARCHAR,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'USD',
    status paymentstatus NOT NULL DEFAULT 'NOT_STARTED',
    paypal_status VARCHAR,
    payer_email VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Seed User Profiles (Linking real Supabase Auth IDs)
INSERT INTO profiles (id, email, full_name, organization, created_at, updated_at)
VALUES 
    ('""" + ELENA_ID + """', 'elena@acmeglobal.com', 'Elena Rostova', 'Acme Global Ventures LLC', NOW(), NOW()),
    ('""" + TARIRO_ID + """', 'tariro@devstudio.co.zw', 'Tariro Moyo', 'DevStudio Zimbabwe', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    full_name = EXCLUDED.full_name,
    organization = EXCLUDED.organization;
""")

# Contract 1
c1_id = "11111111-1111-1111-1111-111111111111"
m1_1_id = "11111111-1111-1111-1111-000000000001"
m1_2_id = "11111111-1111-1111-1111-000000000002"
m1_3_id = "11111111-1111-1111-1111-000000000003"

crit1_1 = "22222222-1111-1111-1111-000000000001"
crit1_2 = "22222222-1111-1111-1111-000000000002"
crit2_1 = "22222222-1111-1111-1111-000000000003"
crit2_2 = "22222222-1111-1111-1111-000000000004"
crit3_1 = "22222222-1111-1111-1111-000000000005"
crit3_2 = "22222222-1111-1111-1111-000000000006"

deliv_id = "33333333-1111-1111-1111-000000000001"
report_id = "44444444-1111-1111-1111-000000000001"

sql_parts.append(f"""
-- 4. Contract 1: Global Next.js Commerce & Inventory Architecture
INSERT INTO contracts (
    id, code, title, description, category, current_version, status,
    total_amount, currency, staged_amount, released_amount,
    client_id, freelancer_id, freelancer_email, created_at, updated_at
) VALUES (
    '{c1_id}', 'TB-2026-001', 'Global Next.js Commerce & Inventory Architecture',
    'High-performance headless e-commerce platform with automated inventory synchronization and resilient escrow milestone release.',
    'software', 1, 'ACTIVE', 15000.00, 'USD', 6000.00, 4000.00,
    '{ELENA_ID}', '{TARIRO_ID}', 'tariro@devstudio.co.zw', NOW() - INTERVAL '14 days', NOW()
) ON CONFLICT (code) DO NOTHING;

-- Contract 1 Version & Acceptances
INSERT INTO contract_versions (id, contract_id, version_number, title, description, sow_content, created_by, created_at)
VALUES (
    '{uuid.uuid4()}', '{c1_id}', 1, 'Global Next.js Commerce & Inventory Architecture',
    'High-performance headless e-commerce platform with automated inventory synchronization.',
    '{{"overview": "Full-stack headless Next.js web storefront and microservices integration.", "milestones_count": 3}}',
    '{ELENA_ID}', NOW() - INTERVAL '14 days'
) ON CONFLICT DO NOTHING;

INSERT INTO contract_acceptances (id, contract_id, version_number, user_id, role, accepted_at)
VALUES 
    ('{uuid.uuid4()}', '{c1_id}', 1, '{ELENA_ID}', 'client', NOW() - INTERVAL '13 days'),
    ('{uuid.uuid4()}', '{c1_id}', 1, '{TARIRO_ID}', 'freelancer', NOW() - INTERVAL '13 days')
ON CONFLICT DO NOTHING;

-- Contract 1 Milestones
INSERT INTO milestones (id, contract_id, title, description, amount, currency, deadline, status, sort_order, payment_status, created_at, updated_at)
VALUES 
    ('{m1_1_id}', '{c1_id}', 'Design System, Wireframes & Component Specs', 'Comprehensive Figma design system with mobile/desktop responsiveness, accessible tokens, and UI specs.', 4000.00, 'USD', '2026-10-19', 'SETTLED', 0, 'RELEASED', NOW() - INTERVAL '14 days', NOW() - INTERVAL '7 days'),
    ('{m1_2_id}', '{c1_id}', 'Core API & Inventory Synchronization Microservice', 'Event-driven sync microservice consuming Shopify webhooks and updating Postgres cache.', 6000.00, 'USD', '2026-11-05', 'VERIFIED', 1, 'STAGED_IN_SANDBOX', NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 days'),
    ('{m1_3_id}', '{c1_id}', 'Frontend Storefront & Production Integration', 'Responsive Next.js 15 App Router storefront with Algolia instant search and PayPal/Stripe checkout.', 5000.00, 'USD', '2026-11-20', 'PENDING', 2, 'NOT_STARTED', NOW() - INTERVAL '14 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Contract 1 Acceptance Criteria
INSERT INTO acceptance_criteria (id, milestone_id, title, description, evidence_type, status, ai_confidence, feedback, created_at)
VALUES 
    ('{crit1_1}', '{m1_1_id}', 'Complete Figma design tokens & dark/light theme specification', 'Exportable Tailwind tokens covering colors, spacing, and typography.', 'url', 'PASS', 0.98, 'All token variables validated against WCAG AA standards.', NOW() - INTERVAL '14 days'),
    ('{crit1_2}', '{m1_1_id}', 'Interactive prototype for desktop and mobile viewpoints', 'Clickable Figma flow covering catalog, product detail, and cart drawer.', 'url', 'PASS', 0.97, 'Clickable flows verified on mobile and desktop viewports.', NOW() - INTERVAL '14 days'),
    ('{crit2_1}', '{m1_2_id}', 'REST/GraphQL API endpoints with OpenAPI 3.1 documentation', 'Comprehensive Swagger spec with 100% parameter coverage.', 'github_pr', 'PASS', 0.99, 'OpenAPI 3.1 spec adheres to schema contracts.', NOW() - INTERVAL '14 days'),
    ('{crit2_2}', '{m1_2_id}', 'Unit & integration test suite exceeding 85% code coverage', 'Automated pytest / vitest test runner output validating coverage.', 'test_output', 'PASS', 0.96, 'Coverage report confirms 89.4% statements covered.', NOW() - INTERVAL '14 days'),
    ('{crit3_1}', '{m1_3_id}', 'Lighthouse performance score >= 90 on mobile & desktop', 'Core Web Vitals LCP < 2.5s, CLS < 0.1, FID < 100ms.', 'lighthouse', 'PENDING', NULL, NULL, NOW() - INTERVAL '14 days'),
    ('{crit3_2}', '{m1_3_id}', 'Live deployment on production preview with staging payments', 'Render/Vercel staging link with functioning PayPal sandbox checkout.', 'url', 'PENDING', NULL, NULL, NOW() - INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- Contract 1 Delivery & Verification Report for Milestone 2
INSERT INTO deliveries (id, contract_id, milestone_id, submitted_by, description, repo_url, live_url, version, submitted_at)
VALUES (
    '{deliv_id}', '{c1_id}', '{m1_2_id}', '{TARIRO_ID}',
    'Completed core synchronization microservice with 89.4% test coverage and OpenAPI docs.',
    'https://github.com/devstudio-zw/commerce-sync-engine', 'https://api-stage.acmeglobal.com/docs', 1, NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO verification_reports (id, delivery_id, contract_id, milestone_id, overall_score, passed, summary_analysis, model_used, requires_human_review, assessed_at)
VALUES (
    '{report_id}', '{deliv_id}', '{c1_id}', '{m1_2_id}',
    97, true,
    'AI Autonomous Verifier assessed repository devstudio-zw/commerce-sync-engine and test artifacts. All acceptance criteria passed with flying colors.',
    'openai/gpt-oss-120b', false, NOW() - INTERVAL '1 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO criterion_results (id, report_id, criterion_id, passed, score, explanation, assessed_at)
VALUES 
    ('{uuid.uuid4()}', '{report_id}', '{crit2_1}', true, 99, 'OpenAPI 3.1 specifications comprehensively document all 14 routes.', NOW() - INTERVAL '1 days'),
    ('{uuid.uuid4()}', '{report_id}', '{crit2_2}', true, 95, 'Coverage report parsed successfully: 89.4% lines covered.', NOW() - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- Contract 1 Audit Events
INSERT INTO audit_events (id, contract_id, actor_id, actor_name, action, details, created_at)
VALUES 
    ('{uuid.uuid4()}', '{c1_id}', '{ELENA_ID}', 'Elena Rostova (Client)', 'CONTRACT_CREATED', 'Drafted initial contract scope TB-2026-001 with 3 staged milestones ($15,000 USD).', NOW() - INTERVAL '14 days'),
    ('{uuid.uuid4()}', '{c1_id}', '{TARIRO_ID}', 'Tariro Moyo (Freelancer)', 'CONTRACT_ACCEPTED', 'Accepted contract terms and cryptographic milestone boundaries.', NOW() - INTERVAL '13 days'),
    ('{uuid.uuid4()}', '{c1_id}', '{ELENA_ID}', 'Elena Rostova (Client)', 'FUNDS_STAGED', 'Funded Milestone 1 ($4,000 USD) into PayPal sandbox escrow.', NOW() - INTERVAL '13 days'),
    ('{uuid.uuid4()}', '{c1_id}', '{TARIRO_ID}', 'Tariro Moyo (Freelancer)', 'DELIVERY_SUBMITTED', 'Delivered Milestone 1 Figma components and design system tokens.', NOW() - INTERVAL '8 days'),
    ('{uuid.uuid4()}', '{c1_id}', '{ELENA_ID}', 'Elena Rostova (Client)', 'PAYMENT_RELEASED', 'Approved delivery and authorized escrow release of $4,000 USD to Tariro Moyo.', NOW() - INTERVAL '7 days'),
    ('{uuid.uuid4()}', '{c1_id}', '{ELENA_ID}', 'Elena Rostova (Client)', 'FUNDS_STAGED', 'Staged Milestone 2 ($6,000 USD) funds via PayPal checkout.', NOW() - INTERVAL '6 days'),
    ('{uuid.uuid4()}', '{c1_id}', '{TARIRO_ID}', 'Tariro Moyo (Freelancer)', 'DELIVERY_SUBMITTED', 'Submitted Milestone 2 API repository and test coverage reports.', NOW() - INTERVAL '2 days'),
    ('{uuid.uuid4()}', '{c1_id}', NULL, 'TrustBroker AI Guardian', 'VERIFICATION_PASSED', 'AI Verification engine scored delivery at 97/100 (Pass threshold: 85/100). Milestone unlocked for payout approval.', NOW() - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- Staged Payment Attempt
INSERT INTO payment_attempts (id, contract_id, milestone_id, paypal_order_id, paypal_capture_id, amount, currency, status, paypal_status, payer_email, created_at, updated_at)
VALUES 
    ('{uuid.uuid4()}', '{c1_id}', '{m1_1_id}', 'PAYPAL-ORD-RELEASED-001', 'CAPTURE-4000-USD', 4000.00, 'USD', 'RELEASED', 'COMPLETED', 'elena@acmeglobal.com', NOW() - INTERVAL '13 days', NOW() - INTERVAL '7 days'),
    ('{uuid.uuid4()}', '{c1_id}', '{m1_2_id}', 'PAYPAL-ORD-STAGED-002', 'CAPTURE-6000-USD', 6000.00, 'USD', 'STAGED_IN_SANDBOX', 'COMPLETED', 'elena@acmeglobal.com', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days')
ON CONFLICT (id) DO NOTHING;
""")

output_sql = "\n".join(sql_parts)

with open("supabase_setup.sql", "w", encoding="utf-8") as f:
    f.write(output_sql)

print(f"[OK] Generated supabase_setup.sql ({len(output_sql)} bytes)")
