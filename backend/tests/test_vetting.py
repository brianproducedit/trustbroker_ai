import unittest
from decimal import Decimal

from app.models.contract import Contract, ContractStatus, ContractVisibility
from app.models.user import UserProfile
from app.services.vetting_service import _deterministic_vet


def _contract() -> Contract:
    return Contract(
        title="Landing page",
        description="Build a marketing landing page with React and Tailwind.",
        category="software",
        status=ContractStatus.OPEN,
        visibility=ContractVisibility.OPEN.value,
        required_skills=["React", "Tailwind"],
        total_amount=Decimal("1500.00"),
    )


class VettingNewcomerTests(unittest.TestCase):
    def test_newcomer_is_not_scored_zero_and_past_delivery_is_insufficient(self):
        freelancer = UserProfile(
            email="new@example.com",
            full_name="New Talent",
            profile_completeness=80,
            skills=["React", "Tailwind"],
            portfolio=[{"title": "Shop", "url": "https://example.com/shop"}],
        )
        result = _deterministic_vet(
            freelancer,
            _contract(),
            cover="I have shipped similar marketing sites and can start this week with a clear milestone plan.",
            past_count=0,
            snapshot=[{"title": "Shop", "url": "https://example.com/shop"}, {"title": "Docs", "url": "https://example.com/docs"}],
        )
        self.assertGreater(result["score"], 0)
        self.assertGreaterEqual(result["score"], 25)
        self.assertEqual(result["dimension_scores"]["past_delivery"], "insufficient_evidence")
        self.assertTrue(result["newcomer"])
        self.assertEqual(result["recommendation"], "new_talent")

    def test_incomplete_profile_is_insufficient_evidence_not_zero(self):
        freelancer = UserProfile(
            email="thin@example.com",
            full_name="Thin Profile",
            profile_completeness=20,
            skills=[],
            portfolio=[],
        )
        result = _deterministic_vet(freelancer, _contract(), cover="Hi", past_count=0, snapshot=[])
        self.assertGreater(result["score"], 0)
        self.assertEqual(result["recommendation"], "insufficient_evidence")
        self.assertEqual(result["dimension_scores"]["past_delivery"], "insufficient_evidence")

    def test_experienced_freelancer_gets_numeric_past_delivery(self):
        freelancer = UserProfile(
            email="vet@example.com",
            full_name="Veteran",
            profile_completeness=90,
            skills=["React", "Tailwind"],
            portfolio=[{"title": "App", "url": "https://example.com"}],
        )
        result = _deterministic_vet(freelancer, _contract(), cover="Cover note with enough detail for communication scoring.", past_count=3, snapshot=None)
        self.assertIsInstance(result["dimension_scores"]["past_delivery"], int)
        self.assertNotEqual(result["recommendation"], "new_talent")
        self.assertGreaterEqual(result["score"], 25)


if __name__ == "__main__":
    unittest.main()
