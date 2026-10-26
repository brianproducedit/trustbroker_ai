"""
Database seed script for TrustBroker AI.
Idempotently populates realistic showcase data for hackathon demos.

Usage:
    python -m app.seed
"""
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select
from app.database import engine
from app.models.user import UserProfile
from app.models.contract import Contract, ContractStatus, ContractVersion
from app.models.acceptance import ContractAcceptance
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus, AcceptanceCriterion, CriterionStatus
from app.models.delivery import Delivery
from app.models.verification import VerificationReport, CriterionResult
from app.models.audit import AuditEvent
from app.models.payment import PaymentAttempt


def seed_database():
    now = datetime.now(timezone.utc)
    print("[SEED] Seeding TrustBroker AI showcase database...")

    with Session(engine) as session:
        # 1. User Profiles
        client_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        freelancer_id = uuid.UUID("00000000-0000-0000-0000-000000000002")

        client = session.exec(select(UserProfile).where(UserProfile.email == "elena@acmeglobal.com")).first()
        if not client:
            client = UserProfile(
                id=client_id,
                email="elena@acmeglobal.com",
                full_name="Elena Rostova",
                organization="Acme Global Ventures",
                created_at=now - timedelta(days=30),
                updated_at=now - timedelta(days=30),
            )
            session.add(client)
            session.commit()
            print("  Created Client Profile: Elena Rostova (elena@acmeglobal.com)")
        else:
            client_id = client.id

        freelancer = session.exec(select(UserProfile).where(UserProfile.email == "tariro@devstudio.co.zw")).first()
        if not freelancer:
            freelancer = UserProfile(
                id=freelancer_id,
                email="tariro@devstudio.co.zw",
                full_name="Tariro Moyo",
                organization="DevStudio Zimbabwe",
                created_at=now - timedelta(days=30),
                updated_at=now - timedelta(days=30),
            )
            session.add(freelancer)
            session.commit()
            print("  Created Freelancer Profile: Tariro Moyo (tariro@devstudio.co.zw)")
        else:
            freelancer_id = freelancer.id

        # 2. Check if Showcase Contract 1 exists
        existing_c1 = session.exec(select(Contract).where(Contract.code == "TB-2026-001")).first()
        if not existing_c1:
            contract_id = uuid.uuid4()
            c1 = Contract(
                id=contract_id,
                code="TB-2026-001",
                title="Global Next.js Commerce & Inventory Architecture",
                description="High-performance headless e-commerce platform with automated inventory synchronization and resilient escrow milestone release.",
                category="software",
                current_version=1,
                status=ContractStatus.ACTIVE,
                total_amount=Decimal("15000.00"),
                currency="USD",
                staged_amount=Decimal("6000.00"),
                released_amount=Decimal("4000.00"),
                client_id=client_id,
                freelancer_id=freelancer_id,
                freelancer_email="tariro@devstudio.co.zw",
                created_at=now - timedelta(days=14),
                updated_at=now - timedelta(hours=2),
            )
            session.add(c1)

            # Contract Version 1
            cv1 = ContractVersion(
                id=uuid.uuid4(),
                contract_id=contract_id,
                version_number=1,
                title=c1.title,
                description=c1.description,
                sow_content={
                    "overview": "Full-stack headless Next.js web storefront and microservices integration.",
                    "architecture": "Next.js App Router, TailwindCSS, Supabase DB, Stripe/PayPal Escrow",
                    "milestones_count": 3
                },
                created_by=client_id,
                created_at=now - timedelta(days=14),
            )
            session.add(cv1)

            # Dual party acceptances
            acc_client = ContractAcceptance(
                id=uuid.uuid4(),
                contract_id=contract_id,
                version_number=1,
                user_id=client_id,
                role="client",
                accepted_at=now - timedelta(days=13),
            )
            acc_freelancer = ContractAcceptance(
                id=uuid.uuid4(),
                contract_id=contract_id,
                version_number=1,
                user_id=freelancer_id,
                role="freelancer",
                accepted_at=now - timedelta(days=13),
            )
            session.add(acc_client)
            session.add(acc_freelancer)

            # Milestone 1 (Settled & Released)
            m1_id = uuid.uuid4()
            m1 = Milestone(
                id=m1_id,
                contract_id=contract_id,
                title="Design System, Wireframes & Component Specs",
                description="Comprehensive Figma design system with mobile/desktop responsiveness, accessible tokens, and UI specs.",
                amount=Decimal("4000.00"),
                currency="USD",
                deadline=(now - timedelta(days=7)).strftime("%Y-%m-%d"),
                status=MilestoneStatus.SETTLED,
                sort_order=0,
                payment_status=PaymentStatus.RELEASED,
                created_at=now - timedelta(days=14),
                updated_at=now - timedelta(days=7),
            )
            session.add(m1)

            crit1_1 = AcceptanceCriterion(
                id=uuid.uuid4(),
                milestone_id=m1_id,
                title="Complete Figma design tokens & dark/light theme specification",
                description="Exportable Tailwind tokens covering colors, spacing, and typography.",
                evidence_type="url",
                status=CriterionStatus.PASS,
                ai_confidence=0.98,
                feedback="All token variables validated against WCAG AA standards.",
                created_at=now - timedelta(days=14),
            )
            crit1_2 = AcceptanceCriterion(
                id=uuid.uuid4(),
                milestone_id=m1_id,
                title="Interactive prototype for desktop and mobile viewpoints",
                description="Clickable Figma flow covering catalog, product detail, and cart drawer.",
                evidence_type="url",
                status=CriterionStatus.PASS,
                ai_confidence=0.95,
                feedback="Full checkout prototype verified with smooth transitions.",
                created_at=now - timedelta(days=14),
            )
            session.add(crit1_1)
            session.add(crit1_2)

            # Milestone 2 (In Verification - Ready for Demo Release)
            m2_id = uuid.uuid4()
            m2 = Milestone(
                id=m2_id,
                contract_id=contract_id,
                title="Storefront & Cart Checkout Integration",
                description="Production Next.js storefront with dynamic product routing, stateful cart, and PayPal sandbox checkout.",
                amount=Decimal("6000.00"),
                currency="USD",
                deadline=(now + timedelta(days=5)).strftime("%Y-%m-%d"),
                status=MilestoneStatus.VERIFIED,
                sort_order=1,
                payment_status=PaymentStatus.STAGED_IN_SANDBOX,
                created_at=now - timedelta(days=14),
                updated_at=now - timedelta(hours=3),
            )
            session.add(m2)

            crit2_1 = AcceptanceCriterion(
                id=uuid.uuid4(),
                milestone_id=m2_id,
                title="Next.js App Router implementation with sub-second page loads",
                description="Lighthouse performance score >= 90 across all product catalog views.",
                evidence_type="url",
                status=CriterionStatus.PASS,
                ai_confidence=0.96,
                feedback="Lighthouse report confirms 94 performance score with optimized Next/Image.",
                created_at=now - timedelta(days=14),
            )
            crit2_2 = AcceptanceCriterion(
                id=uuid.uuid4(),
                milestone_id=m2_id,
                title="PayPal Sandbox orders v2 integration with server-side capture",
                description="End-to-end checkout flow tested with verified webhook handling.",
                evidence_type="text",
                status=CriterionStatus.PASS,
                ai_confidence=0.93,
                feedback="Orders created and captured via backend routes with idempotency checks.",
                created_at=now - timedelta(days=14),
            )
            session.add(crit2_1)
            session.add(crit2_2)

            # Delivery record for Milestone 2
            deliv2_id = uuid.uuid4()
            deliv2 = Delivery(
                id=deliv2_id,
                contract_id=contract_id,
                milestone_id=m2_id,
                submitted_by=freelancer_id,
                description="Deployed Next.js storefront with live PayPal sandbox credentials and end-to-end checkout suite.",
                repo_url="https://github.com/devstudio/next-commerce-demo",
                live_url="https://commerce-demo.devstudio.co.zw",
                version=1,
                submitted_at=now - timedelta(hours=4),
            )
            session.add(deliv2)

            # AI Verification report for Milestone 2 (Groq LPU evaluation)
            v_report = VerificationReport(
                id=uuid.uuid4(),
                delivery_id=deliv2_id,
                contract_id=contract_id,
                milestone_id=m2_id,
                overall_score=94,
                passed=True,
                summary_analysis="Groq LPU evaluated all deliverables against agreed criteria. High code quality, complete test coverage, and responsive UX verified.",
                model_used="openai/gpt-oss-120b",
                requires_human_review=False,
                assessed_at=now - timedelta(hours=3),
            )
            session.add(v_report)

            c_res1 = CriterionResult(
                id=uuid.uuid4(),
                report_id=v_report.id,
                criterion_id=crit2_1.id,
                passed=True,
                score=96,
                explanation="Verified Next.js App Router code and benchmark timings meet criterion threshold.",
                assessed_at=now - timedelta(hours=3),
            )
            c_res2 = CriterionResult(
                id=uuid.uuid4(),
                report_id=v_report.id,
                criterion_id=crit2_2.id,
                passed=True,
                score=92,
                explanation="Server capture API logs match PayPal sandbox mock execution.",
                assessed_at=now - timedelta(hours=3),
            )
            session.add(c_res1)
            session.add(c_res2)

            # Milestone 3 (Pending & In Progress)
            m3_id = uuid.uuid4()
            m3 = Milestone(
                id=m3_id,
                contract_id=contract_id,
                title="ERP Inventory Sync & Automated Load Testing",
                description="Automated cron sync with warehouse ERP and k6 load test results for 10,000 concurrent sessions.",
                amount=Decimal("5000.00"),
                currency="USD",
                deadline=(now + timedelta(days=20)).strftime("%Y-%m-%d"),
                status=MilestoneStatus.IN_PROGRESS,
                sort_order=2,
                payment_status=PaymentStatus.NOT_STARTED,
                created_at=now - timedelta(days=14),
                updated_at=now - timedelta(days=14),
            )
            session.add(m3)

            crit3_1 = AcceptanceCriterion(
                id=uuid.uuid4(),
                milestone_id=m3_id,
                title="Bidirectional inventory delta webhook sync within 5 seconds",
                description="ERP stock changes propagate to storefront index under 5 seconds.",
                evidence_type="text",
                status=CriterionStatus.PENDING,
                created_at=now - timedelta(days=14),
            )
            session.add(crit3_1)

            # Audit Trail for Contract 1
            audits = [
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=client_id,
                    actor_name="Elena Rostova",
                    action="contract_created",
                    details="Contract TB-2026-001 created with 3 milestones totaling $15,000.00.",
                    created_at=now - timedelta(days=14),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=freelancer_id,
                    actor_name="Tariro Moyo",
                    action="contract_accepted",
                    details="Freelancer accepted contract terms for version 1.",
                    created_at=now - timedelta(days=13),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=client_id,
                    actor_name="Elena Rostova",
                    action="payment_staged",
                    details="Staged $4,000.00 into PayPal Sandbox Escrow for Milestone 1.",
                    created_at=now - timedelta(days=12),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=client_id,
                    actor_name="Elena Rostova",
                    action="payment_released",
                    details="Authorized release of $4,000.00 for Milestone 1 after verified delivery.",
                    created_at=now - timedelta(days=7),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=client_id,
                    actor_name="Elena Rostova",
                    action="payment_staged",
                    details="Staged $6,000.00 into PayPal Sandbox Escrow for Milestone 2.",
                    created_at=now - timedelta(days=6),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=freelancer_id,
                    actor_name="Tariro Moyo",
                    action="delivery_submitted",
                    details="Submitted delivery evidence for Milestone 2: Storefront & Cart Checkout Integration.",
                    created_at=now - timedelta(hours=4),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_name="Groq LPU (gpt-oss-120b)",
                    action="ai_verification_completed",
                    details="AI evaluation passed with score 94/100. Deliverable meets all criteria.",
                    created_at=now - timedelta(hours=3),
                ),
            ]
            for a in audits:
                session.add(a)

            session.commit()
            print("  Created Showcase Contract 1: TB-2026-001 (Active, $15,000.00)")
        else:
            print("  Contract TB-2026-001 already exists.")

        print("[OK] Database seeding complete.")


if __name__ == "__main__":
    seed_database()
