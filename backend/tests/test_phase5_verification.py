"""
Automated Test Suite for Phase 5 — Multimodal Milestone Verification Engine.
Verifies adapters (http_probe, vision, document, repo_meta, zip_listing),
safety validations, scoring rules and orchestrator execution.
"""
import io
import sys
import unittest
import uuid
import zipfile
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, ".")

from app.models.contract import Contract, ContractStatus
from app.models.milestone import Milestone, MilestoneStatus, AcceptanceCriterion, CriterionStatus, PaymentStatus
from app.models.delivery import Delivery, DeliveryFile
from app.models.user import UserProfile
from app.services.verification.safety import validate_evidence_file, sanitize_filename
from app.services.verification.adapters import http_probe, zip_listing, repo_meta, document
from app.services.verification import scoring
from app.services.verification.orchestrator import run_verification_orchestration
from sqlmodel import Session, create_engine, SQLModel


class TestPhase5Safety(unittest.TestCase):
    def test_allowed_file_types(self):
        valid_files = [
            ("screenshot.png", 1024 * 500, "image/png"),
            ("spec.pdf", 1024 * 1024 * 2, "application/pdf"),
            ("bundle.zip", 1024 * 1024 * 5, "application/zip"),
            ("notes.md", 2048, "text/markdown"),
        ]
        for name, size, mime in valid_files:
            safe, reason = validate_evidence_file(name, size, mime)
            self.assertTrue(safe, f"Expected {name} to be valid, but got: {reason}")

    def test_rejected_dangerous_types(self):
        dangerous = ["hack.exe", "install.bat", "run.sh", "payload.bin", "trojan.vbs"]
        for name in dangerous:
            safe, reason = validate_evidence_file(name, 1024, "application/octet-stream")
            self.assertFalse(safe, f"Expected {name} to be rejected")
            self.assertIn("prohibited", reason.lower())

    def test_file_size_limit(self):
        oversized = 30 * 1024 * 1024  # 30 MB
        safe, reason = validate_evidence_file("huge.png", oversized, "image/png")
        self.assertFalse(safe)
        self.assertIn("exceeds the 25mb limit", reason.lower())

    def test_sanitize_filename(self):
        self.assertEqual(sanitize_filename("../../etc/passwd"), "passwd")
        self.assertEqual(sanitize_filename("clean_screenshot.png"), "clean_screenshot.png")


class TestPhase5Adapters(unittest.TestCase):
    def test_http_probe_reachable(self):
        # Test known stable URL
        res = http_probe.probe_live_url("https://example.com", timeout=5.0)
        if res["reachable"]:
            self.assertTrue(res["passed"])
            self.assertEqual(res["status_code"], 200)
            self.assertTrue(res["is_tls"])
            self.assertIn("HTTP 200", res["citation"])

    def test_http_probe_sad_path(self):
        res = http_probe.probe_live_url("https://httpbin.org/status/404", timeout=5.0)
        if res["reachable"]:
            self.assertFalse(res["passed"])
            self.assertEqual(res["status_code"], 404)
            self.assertIsNotNone(res["error"])

    def test_zip_listing_safe(self):
        # Create in-memory zip
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("src/index.tsx", "export const App = () => <div>Hello</div>;")
            zf.writestr("package.json", '{"name": "test-pkg"}')
            zf.writestr("README.md", "# Test Project")
        zip_bytes = buf.getvalue()

        res = zip_listing.inspect_zip_archive("test.zip", file_bytes=zip_bytes)
        self.assertTrue(res["passed"])
        self.assertEqual(res["total_files"], 3)
        self.assertFalse(res["has_security_warning"])
        self.assertIn(".tsx", res["extensions_found"])

    def test_zip_listing_traversal_detection(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("../../etc/shadow", "root:x:0:0:")
        bad_zip = buf.getvalue()

        res = zip_listing.inspect_zip_archive("bad.zip", file_bytes=bad_zip)
        self.assertFalse(res["passed"])
        self.assertTrue(res["has_security_warning"])

    def test_repo_meta_parsing(self):
        coords = repo_meta.parse_github_coords("https://github.com/devstudio/react-landing-verified.git")
        self.assertIsNotNone(coords)
        self.assertEqual(coords[0], "devstudio")
        self.assertEqual(coords[1], "react-landing-verified")


class TestPhase5Scoring(unittest.TestCase):
    def test_factual_criterion_pass(self):
        res = scoring.score_criterion_result(
            criterion_id=str(uuid.uuid4()),
            title="TypeScript clean build",
            description="Code compiles with tsc -b with 0 errors",
            evidence_type="source_archive",
            adapter_facts={
                "adapter": "zip_listing",
                "passed": True,
                "citation": "3 files verified",
                "error": None,
            },
        )
        self.assertEqual(res["status"], CriterionStatus.PASS)
        self.assertTrue(res["passed"])
        self.assertGreaterEqual(res["score"], 80)

    def test_hard_fail_criterion(self):
        res = scoring.score_criterion_result(
            criterion_id=str(uuid.uuid4()),
            title="Live staging URL",
            description="Reachable HTTPS URL",
            evidence_type="live_url",
            adapter_facts={
                "adapter": "http_probe",
                "passed": False,
                "citation": "HTTP 404",
                "error": "Returned HTTP status 404",
            },
        )
        self.assertEqual(res["status"], CriterionStatus.FAIL)
        self.assertFalse(res["passed"])
        self.assertEqual(res["score"], 0)

    def test_subjective_criterion_needs_review(self):
        res = scoring.score_criterion_result(
            criterion_id=str(uuid.uuid4()),
            title="Modern aesthetic look and feel",
            description="Creative and beautiful design appealing to tech founders",
            evidence_type="screenshot",
            adapter_facts={
                "adapter": "vision",
                "passed": True,
                "citation": "Screenshot rendered",
                "error": None,
            },
            auto_pass_allowed=False,
        )
        self.assertEqual(res["status"], CriterionStatus.NEEDS_REVIEW)
        self.assertTrue(res["requires_review"])


class TestPhase5Orchestrator(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        SQLModel.metadata.create_all(self.engine)
        self.session = Session(self.engine)

        # Create Client & Freelancer
        self.client_user = UserProfile(
            id=uuid.uuid4(),
            email="client@test.ai",
            full_name="Client Test",
            primary_workspace="client",
        )
        self.freelancer_user = UserProfile(
            id=uuid.uuid4(),
            email="freelancer@test.ai",
            full_name="Freelancer Test",
            primary_workspace="freelancer",
            paypal_payout_email="freelancer-payout@sandbox.paypal.com",
        )
        self.session.add(self.client_user)
        self.session.add(self.freelancer_user)
        self.session.commit()

        # Create Contract
        self.contract = Contract(
            id=uuid.uuid4(),
            code="TB-TEST-001",
            title="React Landing Page MVP",
            description="Full landing page with PayPal checkout",
            client_id=self.client_user.id,
            freelancer_id=self.freelancer_user.id,
            status=ContractStatus.ACTIVE,
            total_amount=Decimal("1200.00"),
            currency="USD",
        )
        self.session.add(self.contract)
        self.session.commit()

        # Create Milestone
        self.milestone = Milestone(
            id=uuid.uuid4(),
            contract_id=self.contract.id,
            title="Milestone 1: Prototype Delivery",
            description="Initial prototype with responsive grid",
            amount=Decimal("600.00"),
            status=MilestoneStatus.IN_PROGRESS,
            payment_status=PaymentStatus.STAGED_IN_SANDBOX,
        )
        self.session.add(self.milestone)
        self.session.commit()

        # Create Acceptance Criteria
        self.criterion1 = AcceptanceCriterion(
            id=uuid.uuid4(),
            milestone_id=self.milestone.id,
            title="Clean Source Archive",
            description="Intact source zip archive",
            evidence_type="source_archive",
        )
        self.criterion2 = AcceptanceCriterion(
            id=uuid.uuid4(),
            milestone_id=self.milestone.id,
            title="GitHub Repository Structure",
            description="Public GitHub repository link",
            evidence_type="repo",
        )
        self.session.add(self.criterion1)
        self.session.add(self.criterion2)
        self.session.commit()

        # Create Delivery
        self.delivery = Delivery(
            id=uuid.uuid4(),
            contract_id=self.contract.id,
            milestone_id=self.milestone.id,
            submitted_by=self.freelancer_user.id,
            description="Prototype deliverables submitted with source archive and repo link.",
            repo_url="https://github.com/octocat/Hello-World",
            live_url="https://react-landing-demo.vercel.app",
            version=1,
        )
        self.session.add(self.delivery)
        self.session.commit()

        # Attach zip file written to disk
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("src/App.tsx", "export default () => <h1>TrustBroker</h1>;")
        
        self.test_zip_path = "test_prototype.zip"
        with open(self.test_zip_path, "wb") as f:
            f.write(buf.getvalue())
        
        self.delivery_file = DeliveryFile(
            id=uuid.uuid4(),
            delivery_id=self.delivery.id,
            file_name="prototype.zip",
            storage_path=self.test_zip_path,
            size_bytes=len(buf.getvalue()),
            mime_type="application/zip",
        )
        self.session.add(self.delivery_file)
        self.session.commit()

    def tearDown(self):
        import os
        self.session.close()
        if hasattr(self, "test_zip_path") and os.path.exists(self.test_zip_path):
            os.remove(self.test_zip_path)

    def test_orchestration_run(self):
        result = run_verification_orchestration(
            session=self.session,
            contract_id=self.contract.id,
            milestone_id=self.milestone.id,
            delivery_id=self.delivery.id,
            actor=self.freelancer_user,
        )

        self.assertIn("report_id", result)
        self.assertIn("overall_score", result)
        self.assertGreaterEqual(result["overall_score"], 70)
        self.assertIn("criterion_evaluations", result)
        self.assertEqual(len(result["criterion_evaluations"]), 2)

        # Refresh milestone
        self.session.refresh(self.milestone)
        self.assertIn(self.milestone.status, [MilestoneStatus.VERIFIED, MilestoneStatus.SUBMITTED])


if __name__ == "__main__":
    unittest.main()
