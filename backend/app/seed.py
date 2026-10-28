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
from app.models.contract import Contract, ContractStatus, ContractVersion, ContractVisibility
from app.models.acceptance import ContractAcceptance
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus, AcceptanceCriterion, CriterionStatus
from app.models.delivery import Delivery
from app.models.verification import VerificationReport, CriterionResult
from app.models.audit import AuditEvent
from app.models.payment import PaymentAttempt
from app.models.marketplace import (
    Application,
    ApplicationStatus,
    VettingReport,
    VettingRecommendation,
    Notification,
)


def seed_database():
    now = datetime.now(timezone.utc)
    print("[SEED] Seeding TrustBroker AI showcase database...")

    with Session(engine) as session:
        # 1. User Profiles (matching real Supabase Auth user IDs)
        client_id = uuid.UUID("35f8c21c-b5d7-4ca7-b4e4-151f3fcfedc2")
        freelancer_id = uuid.UUID("f907f77b-c340-4abe-8c12-a4606b8c2b15")

        # Judge Demo Accounts
        demo_accounts = [
            {
                "id": uuid.UUID("1e0dacbd-8d91-46f2-b04e-02acad08ce0c"),
                "email": "client.demo@trustbroker.ai",
                "full_name": "Elena Rostova (Client)",
                "organization": "Acme Global Ventures LLC",
                "headline": "Fintech & Marketplace Product Lead",
                "bio": "Product and operations lead specializing in autonomous escrow, cross-border settlements, and developer tooling.",
                "skills": ["Product Strategy", "FinTech", "Milestone Escrow", "Vendor Management"],
                "portfolio": [],
                "profile_completeness": 100,
                "primary_workspace": "client",
                "paypal_payout_email": None,
            },
            {
                "id": uuid.UUID("2203012f-e6ac-4efb-8d63-4dc4e1a4bbbc"),
                "email": "freelancer.demo@trustbroker.ai",
                "full_name": "Tariro Moyo (Freelancer)",
                "organization": "DevStudio Zimbabwe",
                "headline": "Senior Full-Stack & API Architect",
                "bio": "Experienced systems architect specializing in high-throughput FastAPI microservices, React/Next.js frontend, and PayPal payment automation.",
                "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "PayPal API", "Docker", "AG Grid"],
                "portfolio": [
                    {
                        "title": "Cross-Border Settlement Engine",
                        "url": "https://github.com/devstudio/settlement-engine",
                        "description": "Processed $2.4M in cross-border settlements with PayPal Payouts integration."
                    },
                    {
                        "title": "Next.js Headless Commerce",
                        "url": "https://github.com/devstudio/next-commerce-demo",
                        "description": "High-speed modern e-commerce storefront with automated checkout validation."
                    }
                ],
                "profile_completeness": 95,
                "primary_workspace": "freelancer",
                "paypal_payout_email": "freelancer-payout@sandbox.paypal.com",
            },
            {
                "id": uuid.UUID("f2b2b247-9690-4a2d-88a6-5a994559dea7"),
                "email": "newcomer.demo@trustbroker.ai",
                "full_name": "Kuda Nyamuda (Newcomer)",
                "organization": "Independent Fullstack",
                "headline": "UI/UX & React Systems Engineer",
                "bio": "Specialized in accessible design systems, fluid motion, and responsive component libraries. Eager to take on milestone-verified projects.",
                "skills": ["React", "Tailwind CSS", "UI/UX", "Next.js", "Figma", "Design Systems"],
                "portfolio": [
                    {
                        "title": "Operations Analytics Dashboard",
                        "url": "https://github.com/independent/ops-dashboard",
                        "description": "Modern React 19 analytics dashboard using Tailwind and AG Grid."
                    }
                ],
                "profile_completeness": 40,
                "primary_workspace": "freelancer",
                "paypal_payout_email": "newcomer-payout@sandbox.paypal.com",
            },
        ]
        for acc in demo_accounts:
            existing_demo = session.exec(select(UserProfile).where(UserProfile.email == acc["email"])).first()
            if not existing_demo:
                p = UserProfile(
                    id=acc["id"],
                    email=acc["email"],
                    full_name=acc["full_name"],
                    organization=acc["organization"],
                    headline=acc["headline"],
                    bio=acc["bio"],
                    skills=acc["skills"],
                    portfolio=acc["portfolio"],
                    profile_completeness=acc["profile_completeness"],
                    primary_workspace=acc["primary_workspace"],
                    paypal_payout_email=acc["paypal_payout_email"],
                    created_at=now - timedelta(days=20),
                    updated_at=now - timedelta(days=1),
                )
                session.add(p)
                session.commit()
                print(f"  Created Demo Profile: {acc['full_name']} ({acc['email']})")
            else:
                existing_demo.full_name = acc["full_name"]
                existing_demo.headline = acc["headline"]
                existing_demo.bio = acc["bio"]
                existing_demo.skills = acc["skills"]
                existing_demo.portfolio = acc["portfolio"]
                existing_demo.profile_completeness = acc["profile_completeness"]
                existing_demo.paypal_payout_email = acc["paypal_payout_email"]
                session.add(existing_demo)
                session.commit()
                print(f"  Updated Demo Profile: {acc['full_name']} ({acc['email']})")

        # 2. Resolve the primary client and freelancer for the showcase contract.
        #    Prefer the official demo accounts (client.demo / freelancer.demo) so
        #    judges logging in with JUDGE_DEMO credentials see the contract.
        demo_client = session.exec(select(UserProfile).where(UserProfile.email == "client.demo@trustbroker.ai")).first()
        demo_freelancer = session.exec(select(UserProfile).where(UserProfile.email == "freelancer.demo@trustbroker.ai")).first()

        # Fall back to the legacy elena/tariro profiles if demo accounts are missing
        contract_client_id = demo_client.id if demo_client else client_id
        contract_freelancer_id = demo_freelancer.id if demo_freelancer else freelancer_id
        contract_freelancer_email = (demo_freelancer.email if demo_freelancer else "tariro@devstudio.co.zw")

        # Also keep the old elena/tariro profiles as linked aliases
        client = session.exec(select(UserProfile).where(UserProfile.email == "elena@acmeglobal.com")).first()
        if not client:
            client = UserProfile(
                id=client_id,
                email="elena@acmeglobal.com",
                full_name="Elena Rostova",
                organization="Acme Global Ventures",
                primary_workspace="client",
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
                primary_workspace="freelancer",
                paypal_payout_email="freelancer-payout@sandbox.paypal.com",
                created_at=now - timedelta(days=30),
                updated_at=now - timedelta(days=30),
            )
            session.add(freelancer)
            session.commit()
            print("  Created Freelancer Profile: Tariro Moyo (tariro@devstudio.co.zw)")
        else:
            freelancer_id = freelancer.id

        # 3. Check if Showcase Contract 1 exists
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
                client_id=contract_client_id,
                freelancer_id=contract_freelancer_id,
                freelancer_email=contract_freelancer_email,
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
                created_by=contract_client_id,
                created_at=now - timedelta(days=14),
            )
            session.add(cv1)

            # Dual party acceptances
            acc_client = ContractAcceptance(
                id=uuid.uuid4(),
                contract_id=contract_id,
                version_number=1,
                user_id=contract_client_id,
                role="client",
                accepted_at=now - timedelta(days=13),
            )
            acc_freelancer = ContractAcceptance(
                id=uuid.uuid4(),
                contract_id=contract_id,
                version_number=1,
                user_id=contract_freelancer_id,
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
                submitted_by=contract_freelancer_id,
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
                    actor_id=contract_client_id,
                    actor_name="Elena Rostova (Client)",
                    action="contract_created",
                    details="Contract TB-2026-001 created with 3 milestones totaling $15,000.00.",
                    created_at=now - timedelta(days=14),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=contract_freelancer_id,
                    actor_name="Tariro Moyo (Freelancer)",
                    action="contract_accepted",
                    details="Freelancer accepted contract terms for version 1.",
                    created_at=now - timedelta(days=13),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=contract_client_id,
                    actor_name="Elena Rostova (Client)",
                    action="payment_staged",
                    details="Staged $4,000.00 into PayPal Sandbox Escrow for Milestone 1.",
                    created_at=now - timedelta(days=12),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=contract_client_id,
                    actor_name="Elena Rostova (Client)",
                    action="payment_released",
                    details="Authorized release of $4,000.00 for Milestone 1 after verified delivery.",
                    created_at=now - timedelta(days=7),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=contract_client_id,
                    actor_name="Elena Rostova (Client)",
                    action="payment_staged",
                    details="Staged $6,000.00 into PayPal Sandbox Escrow for Milestone 2.",
                    created_at=now - timedelta(days=6),
                ),
                AuditEvent(
                    id=uuid.uuid4(),
                    contract_id=contract_id,
                    actor_id=contract_freelancer_id,
                    actor_name="Tariro Moyo (Freelancer)",
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
            # Ensure existing contract points to the demo accounts so judges see it
            needs_update = False
            if demo_client and existing_c1.client_id != demo_client.id:
                existing_c1.client_id = demo_client.id
                needs_update = True
            if demo_freelancer and existing_c1.freelancer_id != demo_freelancer.id:
                existing_c1.freelancer_id = demo_freelancer.id
                existing_c1.freelancer_email = demo_freelancer.email
                needs_update = True
            if needs_update:
                session.add(existing_c1)
                session.commit()
                print("  Contract TB-2026-001 updated to use demo account UUIDs.")
            else:
                print("  Contract TB-2026-001 already exists.")

        # 4. Open Marketplace Listings (P0 Hackathon Requirement: 3 listings)
        listings_seed_data = [
            {
                "code": "TB-2026-002",
                "title": "Cross-Border B2B FinTech Invoice Settlement Portal",
                "description": "Automated payment routing, multi-currency invoicing, and real-time reconciliation platform connecting global suppliers with instant milestone releases.",
                "category": "software",
                "total_amount": Decimal("12000.00"),
                "required_skills": ["Python", "FastAPI", "React", "TypeScript", "PayPal API"],
                "opens_at": now - timedelta(days=2),
                "milestones": [
                    {
                        "title": "Multi-Currency Escrow Engine & Webhook Ingestion",
                        "description": "FastAPI microservice for secure escrow holding and PayPal sandbox webhook event processing.",
                        "amount": Decimal("5000.00"),
                        "deadline": (now + timedelta(days=14)).strftime("%Y-%m-%d"),
                        "criteria": [
                            {
                                "title": "FastAPI REST API handling multi-currency conversion with precision arithmetic",
                                "description": "Endpoints test coverage >= 90% with decimal rounding protection.",
                                "evidence_type": "url",
                            },
                            {
                                "title": "PayPal Sandbox webhook verification with signature digest validation",
                                "description": "Authenticates webhook headers using PayPal public certificates.",
                                "evidence_type": "text",
                            },
                        ],
                    },
                    {
                        "title": "Supplier Ledger UI & Automated Settlement Reports",
                        "description": "Responsive React frontend with AG Grid ledger view, filtering, and PDF export.",
                        "amount": Decimal("7000.00"),
                        "deadline": (now + timedelta(days=28)).strftime("%Y-%m-%d"),
                        "criteria": [
                            {
                                "title": "Responsive React portal with AG Grid ledger filtering and CSV export",
                                "description": "High-density data grid with money formatting and quick search.",
                                "evidence_type": "url",
                            },
                            {
                                "title": "Sub-200ms API response time under concurrent stress tests",
                                "description": "k6 benchmark confirming throughput under 50 concurrent requests.",
                                "evidence_type": "text",
                            },
                        ],
                    },
                ],
            },
            {
                "code": "TB-2026-003",
                "title": "Mobile-First Design System & Micro-Interactions Spec",
                "description": "Production-ready accessible UI component library, tokens, and fluid animated states for the TrustBroker mobile and tablet experience.",
                "category": "design",
                "total_amount": Decimal("6500.00"),
                "required_skills": ["Figma", "Design Systems", "Tailwind CSS", "Accessibility"],
                "opens_at": now - timedelta(days=1),
                "milestones": [
                    {
                        "title": "Accessible Token Architecture & Component Specs",
                        "description": "Design system variables, WCAG AA compliance palettes, and typography scales.",
                        "amount": Decimal("3000.00"),
                        "deadline": (now + timedelta(days=10)).strftime("%Y-%m-%d"),
                        "criteria": [
                            {
                                "title": "WCAG 2.1 AA compliant color contrast and keyboard navigation states",
                                "description": "Verified with Axe DevTools on 20 core application components.",
                                "evidence_type": "url",
                            },
                        ],
                    },
                    {
                        "title": "Figma Component Library & Interactive Prototype",
                        "description": "Full interactive component variant set covering all mobile form factors.",
                        "amount": Decimal("3500.00"),
                        "deadline": (now + timedelta(days=21)).strftime("%Y-%m-%d"),
                        "criteria": [
                            {
                                "title": "Complete interactive variant set covering mobile and tablet views",
                                "description": "Clickable mobile flow from contract creation to milestone verification.",
                                "evidence_type": "url",
                            },
                        ],
                    },
                ],
            },
            {
                "code": "TB-2026-004",
                "title": "Real-Time Telemetry & Financial Operations Dashboard",
                "description": "High-density streaming financial analytics portal integrating AG Studio copilot widgets and live escrow reconciliation.",
                "category": "software",
                "total_amount": Decimal("9500.00"),
                "required_skills": ["AG Grid", "React", "Data Visualization", "Python", "WebSockets"],
                "opens_at": now - timedelta(hours=12),
                "milestones": [
                    {
                        "title": "High-Density AG Grid Ledger with Custom Renderers",
                        "description": "Virtual scroll supporting 10,000 rows with custom money and status pill renderers.",
                        "amount": Decimal("4500.00"),
                        "deadline": (now + timedelta(days=12)).strftime("%Y-%m-%d"),
                        "criteria": [
                            {
                                "title": "Virtual scroll supporting 10,000 rows with sub-16ms frame render times",
                                "description": "Demonstrates 60fps scrolling performance without DOM bloat.",
                                "evidence_type": "url",
                            },
                        ],
                    },
                    {
                        "title": "AG Studio AI Copilot Agent Adapter & KPI Streaming",
                        "description": "Natural language copilot proxy with live database context and streaming responses.",
                        "amount": Decimal("5000.00"),
                        "deadline": (now + timedelta(days=24)).strftime("%Y-%m-%d"),
                        "criteria": [
                            {
                                "title": "Natural language query proxy with live DB telemetry context",
                                "description": "Returns structured financial insights based on real PostgreSQL data.",
                                "evidence_type": "text",
                            },
                        ],
                    },
                ],
            },
        ]

        seeded_listings = {}
        for l_data in listings_seed_data:
            existing_listing = session.exec(select(Contract).where(Contract.code == l_data["code"])).first()
            if not existing_listing:
                c_id = uuid.uuid4()
                new_listing = Contract(
                    id=c_id,
                    code=l_data["code"],
                    title=l_data["title"],
                    description=l_data["description"],
                    category=l_data["category"],
                    current_version=1,
                    status=ContractStatus.OPEN,
                    visibility=ContractVisibility.OPEN.value,
                    required_skills=l_data["required_skills"],
                    opens_at=l_data["opens_at"],
                    total_amount=l_data["total_amount"],
                    currency="USD",
                    staged_amount=Decimal("0.00"),
                    released_amount=Decimal("0.00"),
                    client_id=contract_client_id,
                    freelancer_id=None,
                    freelancer_email=None,
                    created_at=l_data["opens_at"] - timedelta(hours=1),
                    updated_at=l_data["opens_at"],
                )
                session.add(new_listing)
                session.flush()

                # Contract version
                cv = ContractVersion(
                    id=uuid.uuid4(),
                    contract_id=c_id,
                    version_number=1,
                    title=l_data["title"],
                    description=l_data["description"],
                    sow_content={"overview": l_data["description"], "skills": l_data["required_skills"]},
                    created_by=contract_client_id,
                    created_at=l_data["opens_at"],
                )
                session.add(cv)
                session.flush()

                # Milestones & criteria
                for idx, m_info in enumerate(l_data["milestones"]):
                    m_id = uuid.uuid4()
                    m = Milestone(
                        id=m_id,
                        contract_id=c_id,
                        title=m_info["title"],
                        description=m_info["description"],
                        amount=m_info["amount"],
                        currency="USD",
                        deadline=m_info["deadline"],
                        status=MilestoneStatus.PENDING,
                        sort_order=idx,
                        payment_status=PaymentStatus.NOT_STARTED,
                        created_at=l_data["opens_at"],
                        updated_at=l_data["opens_at"],
                    )
                    session.add(m)
                    session.flush()

                    for c_info in m_info["criteria"]:
                        crit = AcceptanceCriterion(
                            id=uuid.uuid4(),
                            milestone_id=m_id,
                            title=c_info["title"],
                            description=c_info["description"],
                            evidence_type=c_info["evidence_type"],
                            status=CriterionStatus.PENDING,
                            created_at=l_data["opens_at"],
                        )
                        session.add(crit)
                    session.flush()

                session.commit()
                seeded_listings[l_data["code"]] = new_listing
                print(f"  Created Marketplace Listing: {l_data['code']} — {l_data['title']} (${l_data['total_amount']})")
            else:
                seeded_listings[l_data["code"]] = existing_listing
                print(f"  Marketplace Listing {l_data['code']} already exists.")

        # 5. Seed Applications for TB-2026-002 (Demonstrating Senior vs Newcomer AI Vetting)
        tb2 = seeded_listings.get("TB-2026-002") or session.exec(select(Contract).where(Contract.code == "TB-2026-002")).first()
        tariro_user = session.exec(select(UserProfile).where(UserProfile.email == "freelancer.demo@trustbroker.ai")).first()
        kuda_user = session.exec(select(UserProfile).where(UserProfile.email == "newcomer.demo@trustbroker.ai")).first()

        if tb2 and tariro_user and kuda_user:
            # Check existing application for Tariro
            app_tariro = session.exec(
                select(Application).where(Application.contract_id == tb2.id, Application.freelancer_id == tariro_user.id)
            ).first()
            if not app_tariro:
                app_tariro = Application(
                    id=uuid.uuid4(),
                    contract_id=tb2.id,
                    freelancer_id=tariro_user.id,
                    cover_note="I have architected high-throughput PayPal checkout workflows and cross-border settlement pipelines. Ready to deliver milestone 1 within 10 days.",
                    proposed_start="Immediate",
                    portfolio_snapshot=tariro_user.portfolio,
                    status=ApplicationStatus.RANKED.value,
                    created_at=now - timedelta(days=1, hours=6),
                    updated_at=now - timedelta(days=1, hours=5),
                )
                session.add(app_tariro)
                session.commit()

                # Vetting report for Tariro (Strong Fit)
                vr_tariro = VettingReport(
                    id=uuid.uuid4(),
                    application_id=app_tariro.id,
                    score=92,
                    recommendation=VettingRecommendation.STRONG_FIT.value,
                    reasons={
                        "summary": "Proven track record with PayPal Payouts APIs and FastAPI architecture.",
                        "matched_skills": ["Python", "FastAPI", "React", "TypeScript", "PayPal API"],
                        "profile_completeness": 95,
                        "risk_factors": [],
                    },
                    model_used="openai/gpt-oss-120b",
                    created_at=now - timedelta(days=1, hours=5),
                )
                session.add(vr_tariro)
                session.commit()
                print("  Created Application & Vetting Report for Tariro Moyo (TB-2026-002: Strong Fit 92%)")

            # Check existing application for Kuda (Newcomer)
            app_kuda = session.exec(
                select(Application).where(Application.contract_id == tb2.id, Application.freelancer_id == kuda_user.id)
            ).first()
            if not app_kuda:
                app_kuda = Application(
                    id=uuid.uuid4(),
                    contract_id=tb2.id,
                    freelancer_id=kuda_user.id,
                    cover_note="Senior UI/UX developer passionate about clean React code and accessible frontends. Excited to build the supplier ledger with AG Grid.",
                    proposed_start="Next Monday",
                    portfolio_snapshot=kuda_user.portfolio,
                    status=ApplicationStatus.RANKED.value,
                    created_at=now - timedelta(hours=18),
                    updated_at=now - timedelta(hours=17),
                )
                session.add(app_kuda)
                session.commit()

                # Vetting report for Kuda (New Talent)
                vr_kuda = VettingReport(
                    id=uuid.uuid4(),
                    application_id=app_kuda.id,
                    score=78,
                    recommendation=VettingRecommendation.NEW_TALENT.value,
                    reasons={
                        "summary": "High-quality portfolio samples and modern React expertise. Low platform contract volume does not penalize base scoring.",
                        "matched_skills": ["React", "Tailwind CSS", "UI/UX"],
                        "newcomer": True,
                        "profile_completeness": 40,
                    },
                    model_used="openai/gpt-oss-120b",
                    created_at=now - timedelta(hours=17),
                )
                session.add(vr_kuda)
                session.commit()
                print("  Created Application & Vetting Report for Kuda Nyamuda (TB-2026-002: New Talent 78%)")

        # 6. Seed In-App Notifications
        if demo_client:
            existing_notifs = session.exec(select(Notification).where(Notification.user_id == demo_client.id)).all()
            if not existing_notifs:
                notifs = [
                    Notification(
                        id=uuid.uuid4(),
                        user_id=demo_client.id,
                        type="application_received",
                        title="New Application Received",
                        body="Tariro Moyo submitted an application for TB-2026-002 (AI Match: 92%).",
                        entity_type="application",
                        entity_id=tb2.id if tb2 else None,
                        read_at=None,
                        created_at=now - timedelta(hours=5),
                    ),
                    Notification(
                        id=uuid.uuid4(),
                        user_id=demo_client.id,
                        type="delivery_ready",
                        title="Milestone Delivery Awaiting Review",
                        body="Milestone 2 for TB-2026-001 has passed automated AI verification with a score of 94/100.",
                        entity_type="contract",
                        entity_id=c1.id if 'c1' in locals() else None,
                        read_at=None,
                        created_at=now - timedelta(hours=3),
                    ),
                ]
                for n in notifs:
                    session.add(n)
                session.commit()
                print("  Created initial notifications for Client Demo.")

        if demo_freelancer:
            existing_f_notifs = session.exec(select(Notification).where(Notification.user_id == demo_freelancer.id)).all()
            if not existing_f_notifs:
                f_notifs = [
                    Notification(
                        id=uuid.uuid4(),
                        user_id=demo_freelancer.id,
                        type="payment_released",
                        title="PayPal Payout Disbursed",
                        body="$4,000.00 USD has been sent to your registered PayPal email for Milestone 1.",
                        entity_type="payout",
                        read_at=now - timedelta(days=6),
                        created_at=now - timedelta(days=7),
                    ),
                    Notification(
                        id=uuid.uuid4(),
                        user_id=demo_freelancer.id,
                        type="verification_passed",
                        title="AI Verification Succeeded (94%)",
                        body="Deliverable evidence for TB-2026-001 Milestone 2 passed all acceptance criteria.",
                        entity_type="contract",
                        read_at=None,
                        created_at=now - timedelta(hours=3),
                    ),
                ]
                for fn in f_notifs:
                    session.add(fn)
                session.commit()
                print("  Created initial notifications for Freelancer Demo.")

        print("[OK] Database seeding complete.")


if __name__ == "__main__":
    seed_database()
