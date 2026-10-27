import uuid
import unittest
from decimal import Decimal
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine
from fastapi.testclient import TestClient

import app.models  # noqa: F401
from app.main import app
from app.database import get_session
from app.models.contract import Contract, ContractStatus, ContractVisibility
from app.models.marketplace import Application, ApplicationStatus
from app.models.milestone import Milestone, MilestoneStatus, PaymentStatus
from app.models.user import UserProfile
from app.services.policy_engine import PolicyEngine
from app.utils.security import get_current_user


def _client_profile() -> UserProfile:
    return UserProfile(id=uuid.uuid4(), email="client@example.com", full_name="Client Demo")


def _freelancer_profile() -> UserProfile:
    return UserProfile(
        id=uuid.uuid4(),
        email="freelancer@example.com",
        full_name="Freelancer Demo",
        paypal_payout_email="freelancer@example.com",
    )


def _open_contract(client: UserProfile) -> Contract:
    return Contract(
        id=uuid.uuid4(),
        code="TB-2026-100",
        title="Open listing",
        description="Build a landing page",
        status=ContractStatus.OPEN,
        visibility=ContractVisibility.OPEN.value,
        total_amount=Decimal("1500.00"),
        client_id=client.id,
    )


class PolicyMarketplaceTests(unittest.TestCase):
    def test_non_client_cannot_award(self):
        client = _client_profile()
        freelancer = _freelancer_profile()
        other = UserProfile(id=uuid.uuid4(), email="other@example.com", full_name="Other")
        contract = _open_contract(client)
        application = Application(
            contract_id=contract.id,
            freelancer_id=freelancer.id,
            status=ApplicationStatus.RANKED.value,
        )
        result = PolicyEngine.can_award(other, contract, application, freelancer)
        self.assertFalse(result.allowed)
        self.assertIn("client", result.reason.lower())

    def test_client_can_award_open_ranked_application(self):
        client = _client_profile()
        freelancer = _freelancer_profile()
        contract = _open_contract(client)
        application = Application(
            contract_id=contract.id,
            freelancer_id=freelancer.id,
            status=ApplicationStatus.RANKED.value,
        )
        result = PolicyEngine.can_award(client, contract, application, freelancer)
        self.assertTrue(result.allowed)

    def test_client_cannot_apply_to_own_listing(self):
        client = _client_profile()
        contract = _open_contract(client)
        self.assertFalse(PolicyEngine.can_apply(client, contract).allowed)

    def test_can_fund_requires_active_contract(self):
        client = _client_profile()
        contract = _open_contract(client)
        milestone = Milestone(
            contract_id=contract.id,
            title="M1",
            amount=Decimal("500.00"),
            status=MilestoneStatus.PENDING,
            payment_status=PaymentStatus.NOT_STARTED,
        )
        self.assertFalse(PolicyEngine.can_fund(client, contract, milestone).allowed)
        contract.status = ContractStatus.ACTIVE
        self.assertTrue(PolicyEngine.can_fund(client, contract, milestone).allowed)


class MarketplaceFlowTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SQLModel.metadata.create_all(self.engine)
        self.session = Session(self.engine)
        self.client_user = UserProfile(
            email="client.flow@example.com",
            full_name="Ada Client",
            primary_workspace="client",
        )
        self.freelancer_user = UserProfile(
            email="freelancer.flow@example.com",
            full_name="Nia Freelancer",
            primary_workspace="freelancer",
            paypal_payout_email="freelancer.flow@example.com",
            skills=["react", "typescript"],
            headline="Frontend freelancer",
            bio="I ship production React apps with accessible UI and reliable delivery.",
            profile_completeness=70,
        )
        self.session.add(self.client_user)
        self.session.add(self.freelancer_user)
        self.session.commit()
        self.session.refresh(self.client_user)
        self.session.refresh(self.freelancer_user)
        self.active_user = self.client_user

        def override_session():
            yield self.session

        def override_user():
            return self.active_user

        app.dependency_overrides[get_session] = override_session
        app.dependency_overrides[get_current_user] = override_user
        self.api = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.session.close()
        self.engine.dispose()

    def test_draft_publish_apply_award_accept_and_duplicate_apply(self):
        create = self.api.post(
            "/api/v1/contracts",
            json={
                "title": "Marketing landing page",
                "description": "Responsive landing page with PayPal CTA",
                "category": "software",
                "required_skills": ["react"],
                "milestones": [
                    {
                        "title": "Design and build",
                        "description": "Ship the page",
                        "amount": "1200.00",
                        "acceptance_criteria": [
                            {"title": "Live URL loads", "description": "HTTP 200", "evidence_type": "url"}
                        ],
                    }
                ],
            },
        )
        self.assertEqual(create.status_code, 201, create.text)
        contract_id = create.json()["id"]
        self.assertEqual(create.json()["status"], "draft")

        publish = self.api.post(f"/api/v1/contracts/{contract_id}/publish")
        self.assertEqual(publish.status_code, 200, publish.text)
        self.assertEqual(publish.json()["status"], "open")
        self.assertEqual(publish.json()["visibility"], "open")

        self.active_user = self.freelancer_user
        listings = self.api.get("/api/v1/listings", params={"skill": "react"})
        self.assertEqual(listings.status_code, 200, listings.text)
        self.assertGreaterEqual(listings.json()["total"], 1)

        apply_payload = {"cover_note": "I can deliver this in a week.", "proposed_start": "2026-11-03"}
        first_apply = self.api.post(f"/api/v1/contracts/{contract_id}/applications", json=apply_payload)
        self.assertEqual(first_apply.status_code, 201, first_apply.text)
        application_id = first_apply.json()["id"]

        second_apply = self.api.post(f"/api/v1/contracts/{contract_id}/applications", json=apply_payload)
        self.assertEqual(second_apply.status_code, 409, second_apply.text)

        forbidden_award = self.api.post(f"/api/v1/applications/{application_id}/award")
        self.assertEqual(forbidden_award.status_code, 403, forbidden_award.text)

        self.active_user = self.client_user
        apps = self.api.get(f"/api/v1/contracts/{contract_id}/applications")
        self.assertEqual(apps.status_code, 200, apps.text)
        self.assertEqual(apps.json()["total"], 1)

        award = self.api.post(f"/api/v1/applications/{application_id}/award")
        self.assertEqual(award.status_code, 200, award.text)
        self.assertEqual(award.json()["status"], "pending_acceptance")
        self.assertEqual(award.json()["freelancer_id"], str(self.freelancer_user.id))

        self.active_user = self.freelancer_user
        accept = self.api.post(f"/api/v1/contracts/{contract_id}/accept")
        self.assertEqual(accept.status_code, 200, accept.text)
        self.assertEqual(accept.json()["status"], "active")

        notes = self.api.get("/api/v1/notifications")
        self.assertEqual(notes.status_code, 200, notes.text)
        self.assertGreaterEqual(notes.json()["total"], 1)


if __name__ == "__main__":
    unittest.main()
