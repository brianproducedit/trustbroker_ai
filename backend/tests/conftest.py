"""
TrustBroker AI — Test Fixtures & Shared SQLite In-Memory Database
Provides reusable test database sessions, client/freelancer test fixtures,
and isolated FastAPI test clients.
"""
import uuid
from decimal import Decimal
import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine
from fastapi.testclient import TestClient

import app.models  # noqa: F401
from app.main import app
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract, ContractStatus, ContractVisibility
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus
from app.utils.security import get_current_user


@pytest.fixture(name="engine")
def engine_fixture():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)
    yield test_engine


@pytest.fixture(name="session")
def session_fixture(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client_user")
def client_user_fixture(session: Session) -> UserProfile:
    user = UserProfile(
        id=uuid.uuid4(),
        email="elena.rostova@acmeglobal.test",
        full_name="Elena Rostova",
        primary_workspace="client",
        paypal_payout_email="elena-buyer@sandbox.paypal.com",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="freelancer_user")
def freelancer_user_fixture(session: Session) -> UserProfile:
    user = UserProfile(
        id=uuid.uuid4(),
        email="tariro.moyo@devstudio.test",
        full_name="Tariro Moyo",
        primary_workspace="freelancer",
        paypal_payout_email="tariro-freelancer@sandbox.paypal.com",
        skills=["React", "TypeScript", "Next.js 14", "Tailwind CSS", "FastAPI", "PostgreSQL"],
        portfolio=[
            {"title": "React Admin Dashboard", "url": "https://github.com/Eliasuarez04/React-Admin-Dashboard"},
            {"title": "Next.js SaaS Starter", "url": "https://github.com/nextjs/saas-starter"},
        ],
        profile_completeness=95,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="test_contract")
def test_contract_fixture(session: Session, client_user: UserProfile, freelancer_user: UserProfile) -> Contract:
    contract = Contract(
        id=uuid.uuid4(),
        code="TB-TEST-001",
        title="Production React & TypeScript Dashboard",
        description="Deliver a responsive SaaS dashboard with TypeScript and PayPal integration.",
        client_id=client_user.id,
        freelancer_id=freelancer_user.id,
        status=ContractStatus.ACTIVE,
        visibility=ContractVisibility.PRIVATE.value,
        total_amount=Decimal("1500.00"),
        staged_amount=Decimal("500.00"),
        released_amount=Decimal("0.00"),
        currency="USD",
        version=1,
    )
    session.add(contract)
    session.commit()
    session.refresh(contract)
    return contract
