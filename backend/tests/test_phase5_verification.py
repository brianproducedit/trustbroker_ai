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
from app.services.verification.adapters import http_probe, zip_listing, repo_meta, document, vision
from app.services.verification import scoring
from app.services.verification.orchestrator import run_verification_orchestration
from unittest.mock import patch, MagicMock
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

    def test_blob_url_rejected_in_delivery(self):
        from app.schemas.delivery import DeliveryCreateRequest, DeliveryFileCreate
        from app.services.delivery_service import submit_delivery
        from fastapi import HTTPException
        engine = create_engine("sqlite:///:memory:")
        SQLModel.metadata.create_all(engine)
        with Session(engine) as session:
            client = UserProfile(id=uuid.uuid4(), email="client@test.com", role="client")
            freelancer = UserProfile(id=uuid.uuid4(), email="freelancer@test.com", role="freelancer")
            contract = Contract(
                id=uuid.uuid4(),
                code="TB-BLOB-001",
                title="Blob Test Contract",
                client_id=client.id,
                freelancer_id=freelancer.id,
                status=ContractStatus.ACTIVE,
                total_amount=Decimal("100.00"),
            )
            milestone = Milestone(
                id=uuid.uuid4(),
                contract_id=contract.id,
                title="Milestone 1",
                amount=Decimal("100.00"),
                status=MilestoneStatus.IN_PROGRESS,
                payment_status=PaymentStatus.STAGED_IN_SANDBOX,
            )
            session.add_all([client, freelancer, contract, milestone])
            session.commit()

            req = DeliveryCreateRequest(
                contract_id=contract.id,
                milestone_id=milestone.id,
                description="Delivery with blob URL",
                files=[
                    DeliveryFileCreate(
                        file_name="screenshot.png",
                        storage_path="blob:http://localhost:5173/abc-123",
                        size_bytes=1024,
                        mime_type="image/png",
                    )
                ],
                auto_verify=False,
            )
            with self.assertRaises(HTTPException) as cm:
                submit_delivery(session=session, freelancer=freelancer, req=req)
            self.assertEqual(cm.exception.status_code, 400)
            self.assertIn("blob:", cm.exception.detail)

    def test_cross_user_storage_path_rejected(self):
        from app.schemas.delivery import DeliveryCreateRequest, DeliveryFileCreate
        from app.services.delivery_service import submit_delivery
        from fastapi import HTTPException
        engine = create_engine("sqlite:///:memory:")
        SQLModel.metadata.create_all(engine)
        with Session(engine) as session:
            client = UserProfile(id=uuid.uuid4(), email="client@test.com", role="client")
            freelancer = UserProfile(id=uuid.uuid4(), email="freelancer@test.com", role="freelancer")
            other_user_id = uuid.uuid4()
            contract = Contract(
                id=uuid.uuid4(),
                code="TB-CROSS-001",
                title="Cross User Storage Test",
                client_id=client.id,
                freelancer_id=freelancer.id,
                status=ContractStatus.ACTIVE,
                total_amount=Decimal("100.00"),
            )
            milestone = Milestone(
                id=uuid.uuid4(),
                contract_id=contract.id,
                title="Milestone 1",
                amount=Decimal("100.00"),
                status=MilestoneStatus.IN_PROGRESS,
                payment_status=PaymentStatus.STAGED_IN_SANDBOX,
            )
            session.add_all([client, freelancer, contract, milestone])
            session.commit()

            # Attempt to attach another user's storage path
            req = DeliveryCreateRequest(
                contract_id=contract.id,
                milestone_id=milestone.id,
                description="Delivery trying to hijack another user's file",
                files=[
                    DeliveryFileCreate(
                        file_name="stolen_doc.pdf",
                        storage_path=f"uploads/evidence/{other_user_id}/stolen_file.pdf",
                        size_bytes=1024,
                        mime_type="application/pdf",
                    )
                ],
                auto_verify=False,
            )
            with self.assertRaises(HTTPException) as cm:
                submit_delivery(session=session, freelancer=freelancer, req=req)
            self.assertEqual(cm.exception.status_code, 400)
            self.assertIn("not authenticated uploader", cm.exception.detail)

    def test_path_traversal_storage_path_rejected(self):
        from app.services.verification.safety import validate_storage_path
        uid = uuid.uuid4()
        safe, err = validate_storage_path(f"uploads/evidence/{uid}/../../etc/passwd", uploader_id=uid)
        self.assertFalse(safe)
        self.assertIn("traversal", err.lower())

        safe, err = validate_storage_path("http://evil.com/payload.png", uploader_id=uid)
        self.assertFalse(safe)
        self.assertIn("not permitted", err.lower())


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

    def test_repo_meta_deceptive_host_rejected(self):
        self.assertIsNone(repo_meta.parse_github_coords("https://evilgithub.com/owner/repo"))
        self.assertIsNone(repo_meta.parse_github_coords("https://github.com.evil.com/owner/repo"))

    def test_repo_meta_gitlab_needs_review(self):
        res = repo_meta.inspect_repository("https://gitlab.com/owner/repo")
        self.assertFalse(res["passed"])
        self.assertTrue(res["needs_review"])
        self.assertEqual(res["adapter"], "repo_meta_unsupported")

    def test_repo_meta_network_exception_needs_review_not_pass(self):
        with patch("httpx.Client") as mock_client:
            mock_client.return_value.__enter__.side_effect = Exception("DNS resolution failed")
            res = repo_meta.inspect_repository("https://github.com/nonexistent-org/nonexistent-repo-99")
            self.assertFalse(res["passed"])
            self.assertTrue(res["needs_review"])
            self.assertEqual(res["files_found"], [])  # Must NOT fabricate files_found
            self.assertIn("unavailable", res["adapter"])

    def test_vision_adapter_missing_file_needs_review_not_pass(self):
        res = vision.inspect_screenshot_with_vision(
            image_source="nonexistent_file_path.png",
            criterion_title="UI Hero Section",
            criterion_description="Landing page hero with clear CTA button",
        )
        self.assertFalse(res["passed"])
        self.assertTrue(res["needs_review"])
        self.assertIsNone(res["model_used"])
        self.assertEqual(res["adapter"], "vision_needs_review")

    def test_vision_adapter_missing_api_key_needs_review(self):
        with patch("app.config.settings.groq_api_key", ""), \
             patch("app.config.settings.openrouter_api_key", ""), \
             patch("app.config.settings.deepseek_api_key", ""):
            res = vision.inspect_screenshot_with_vision(
                image_source="data:image/png;base64,iVBORw0KGgo=",
                criterion_title="UI Hero Section",
                criterion_description="Landing page hero with clear CTA button",
            )
            self.assertFalse(res["passed"])
            self.assertTrue(res["needs_review"])
            self.assertIsNone(res["model_used"])

    def test_document_adapter_heuristic_needs_review_not_pass(self):
        # Even when keywords match, heuristic fallback without AI must not pass automatically.
        # Mock AI unavailable so the heuristic path runs (not a live AI pass).
        with patch("app.services.ai_provider.call_groq", return_value=(None, None)), \
             patch("app.services.ai_provider.call_openrouter", return_value=(None, None)), \
             patch("app.services.ai_provider.call_deepseek", return_value=(None, None)):
            res = document.inspect_document(
                file_name="spec.txt",
                criterion_title="Architecture Specification",
                criterion_description="Must detail microservice architecture and data flow",
                file_bytes=b"This architecture document outlines the specification in detail with microservice flow.",
            )
        # Should NOT automatically pass without AI verification
        self.assertFalse(res["passed"])
        self.assertTrue(res["needs_review"])


class TestPhase5Scoring(unittest.TestCase):
    def test_factual_criterion_pass(self):
        """When adapter passes but no AI evaluation is provided, result must be NEEDS_REVIEW.
        Adapter facts are evidence context only — not criterion pass proof.
        PASS requires both adapter passing AND a valid AI evaluation."""
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
        # Without AI evaluation, adapter-only pass must yield NEEDS_REVIEW (not PASS).
        # Phase A.4 fix: removed the unsafe adapter-only PASS path.
        self.assertEqual(res["status"], CriterionStatus.NEEDS_REVIEW)
        self.assertFalse(res["passed"])
        self.assertTrue(res["requires_review"])

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

    def test_orchestration_run_fallback_when_ai_unavailable(self):
        """When AI providers are unavailable, verification safely falls back to NEEDS_REVIEW (not a synthetic PASS)."""
        # Patch all AI call paths (Groq, OpenRouter, DeepSeek) and mock factual repo probe
        mock_repo_facts = {
            "adapter": "github_api",
            "is_github": True,
            "exists": True,
            "passed": True,
            "needs_review": False,
            "owner": "octocat",
            "repo": "Hello-World",
            "language": "JavaScript",
            "default_branch": "master",
            "files_found": ["README", "src/App.tsx"],
            "readme_snippet": "Hello World",
            "citation": "GitHub octocat/Hello-World verified",
            "error": None,
        }
        with patch("app.services.ai_provider.call_ai_with_fallbacks", return_value=(None, "fallback:none")), \
             patch("app.services.ai_provider.call_groq", return_value=(None, None)), \
             patch("app.services.ai_provider.call_openrouter", return_value=(None, None)), \
             patch("app.services.ai_provider.call_deepseek", return_value=(None, None)), \
             patch("app.services.verification.orchestrator.ai_provider.call_groq", return_value=(None, None)), \
             patch("app.services.verification.orchestrator.ai_provider.call_openrouter", return_value=(None, None)), \
             patch("app.services.verification.adapters.repo_meta.inspect_repository", return_value=mock_repo_facts):
            result = run_verification_orchestration(
                session=self.session,
                contract_id=self.contract.id,
                milestone_id=self.milestone.id,
                delivery_id=self.delivery.id,
                actor=self.freelancer_user,
            )

        self.assertIn("report_id", result)
        self.assertIn("overall_score", result)
        # Score must be below the 70-point pass threshold (AI unavailable → cannot issue a full pass)
        self.assertLess(result["overall_score"], 70)
        self.assertFalse(result["passed"])
        self.assertTrue(result["requires_human_review"])
        self.assertEqual(len(result["criterion_evaluations"]), 2)

        # Milestone must be set to SUBMITTED (needs human review), NOT automatically VERIFIED
        self.session.refresh(self.milestone)
        self.assertEqual(self.milestone.status, MilestoneStatus.SUBMITTED)

    def test_metadata_only_adapters_require_human_review(self):
        """Repository/archive metadata cannot independently establish completion."""
        mock_ai_eval = {
            "overall_score": 90,
            "passed": True,
            "summary_analysis": "All criteria met based on intact ZIP and repository structure.",
            "requires_human_review": False,
            "provider_used": "groq:openai/gpt-oss-120b",
            "criterion_evaluations": [
                {
                    "criterion_id": str(self.criterion1.id),
                    "passed": True,
                    "score": 92,
                    "confidence": 0.95,
                    "explanation": "Valid source archive with App.tsx and package.json",
                    "evidence_match_snippet": "Intact ZIP archive",
                },
                {
                    "criterion_id": str(self.criterion2.id),
                    "passed": True,
                    "score": 88,
                    "confidence": 0.90,
                    "explanation": "GitHub repository exists and is accessible.",
                    "evidence_match_snippet": "GitHub octocat/Hello-World",
                },
            ],
        }

        with patch("app.services.ai_provider.evaluate_delivery_against_criteria", return_value=mock_ai_eval):
            with patch("app.services.verification.adapters.repo_meta.inspect_repository") as mock_repo:
                mock_repo.return_value = {
                    "adapter": "github_api",
                    "is_github": True,
                    "exists": True,
                    "passed": True,
                    "needs_review": False,
                    "owner": "octocat",
                    "repo": "Hello-World",
                    "language": "JavaScript",
                    "default_branch": "master",
                    "files_found": ["README"],
                    "readme_snippet": "Hello World",
                    "citation": "GitHub octocat/Hello-World verified",
                    "error": None,
                }
                result = run_verification_orchestration(
                    session=self.session,
                    contract_id=self.contract.id,
                    milestone_id=self.milestone.id,
                    delivery_id=self.delivery.id,
                    actor=self.freelancer_user,
                )

        self.assertIn("report_id", result)
        self.assertFalse(result["passed"])
        self.assertTrue(result["requires_human_review"])

        self.session.refresh(self.milestone)
        self.assertEqual(self.milestone.status, MilestoneStatus.SUBMITTED)

    def test_adapter_findings_are_passed_to_ai_evaluator(self):
        """The evaluator must receive the observations produced by evidence adapters."""
        captured = {}

        def capture_evaluator(**kwargs):
            captured.update(kwargs)
            return {
                "overall_score": 50,
                "passed": False,
                "summary_analysis": "Manual review required.",
                "requires_human_review": True,
                "provider_used": "test-provider",
                "criterion_evaluations": [
                    {
                        "criterion_id": str(self.criterion1.id),
                        "passed": False,
                        "score": 50,
                        "confidence": 0.5,
                        "explanation": "Review required.",
                        "evidence_match_snippet": "Adapter observation",
                    },
                    {
                        "criterion_id": str(self.criterion2.id),
                        "passed": False,
                        "score": 50,
                        "confidence": 0.5,
                        "explanation": "Review required.",
                        "evidence_match_snippet": "Adapter observation",
                    },
                ],
            }

        with patch(
            "app.services.ai_provider.evaluate_delivery_against_criteria",
            side_effect=capture_evaluator,
        ):
            with patch(
                "app.services.verification.adapters.repo_meta.inspect_repository",
                return_value={
                    "adapter": "github_api",
                    "exists": True,
                    "passed": True,
                    "needs_review": False,
                    "files_found": ["README.md"],
                    "citation": "GitHub repository inspected",
                    "error": None,
                },
            ):
                delivery = Delivery(
                    id=uuid.uuid4(),
                    contract_id=self.contract.id,
                    milestone_id=self.milestone.id,
                    submitted_by=self.freelancer_user.id,
                    description="Repository delivery",
                    repo_url="https://github.com/octocat/Hello-World",
                )
                self.session.add(delivery)
                self.session.commit()
                run_verification_orchestration(
                    session=self.session,
                    contract_id=self.contract.id,
                    milestone_id=self.milestone.id,
                    delivery_id=delivery.id,
                    actor=self.freelancer_user,
                )

        findings = captured.get("evidence_findings", {})
        self.assertIn(str(self.criterion2.id), findings)
        self.assertEqual(findings[str(self.criterion2.id)]["adapter"], "github_api")
        self.assertTrue(findings[str(self.criterion2.id)]["exists"])

    def test_missing_criterion_in_ai_response_causes_needs_review(self):
        """If AI evaluator omits one of the criteria orchestrator must flag it as NEEDS_REVIEW."""
        mock_incomplete_ai_eval = {
            "overall_score": 90,
            "passed": True,
            "summary_analysis": "Only evaluated criterion 1.",
            "requires_human_review": False,
            "provider_used": "groq:openai/gpt-oss-120b",
            "criterion_evaluations": [
                {
                    "criterion_id": str(self.criterion1.id),
                    "passed": True,
                    "score": 95,
                    "confidence": 0.95,
                    "explanation": "Valid source archive",
                    "evidence_match_snippet": "Intact ZIP",
                },
                # criterion2 is missing from AI response!
            ],
        }
    def test_missing_criterion_in_ai_response_causes_needs_review(self):
        """If AI evaluator omits one of the criteria, orchestrator must flag it as NEEDS_REVIEW."""
        mock_incomplete_ai_eval = {
            "overall_score": 90,
            "passed": True,
            "summary_analysis": "Only evaluated criterion 1.",
            "requires_human_review": False,
            "provider_used": "groq:openai/gpt-oss-120b",
            "criterion_evaluations": [
                {
                    "criterion_id": str(self.criterion1.id),
                    "passed": True,
                    "score": 95,
                    "confidence": 0.95,
                    "explanation": "Valid source archive",
                    "evidence_match_snippet": "Intact ZIP",
                },
                # criterion2 is missing from AI response!
            ],
        }

        with patch("app.services.ai_provider.evaluate_delivery_against_criteria", return_value=mock_incomplete_ai_eval):
            result = run_verification_orchestration(
                session=self.session,
                contract_id=self.contract.id,
                milestone_id=self.milestone.id,
                delivery_id=self.delivery.id,
                actor=self.freelancer_user,
            )

        self.assertFalse(result["passed"])
        self.assertTrue(result["requires_human_review"])
        evals_by_id = {ce["criterion_id"]: ce for ce in result["criterion_evaluations"]}
        missing_crit_eval = evals_by_id.get(str(self.criterion2.id))
        self.assertIsNotNone(missing_crit_eval)
        self.assertEqual(missing_crit_eval["status"], CriterionStatus.NEEDS_REVIEW)
        self.assertIn("manual review", missing_crit_eval["explanation"].lower())

    def test_duplicate_criterion_id_in_ai_response_causes_needs_review(self):
        """Duplicate criterion IDs in AI response must be flagged NEEDS_REVIEW, not overwrite silently."""
        mock_duplicate_ai_eval = {
            "overall_score": 90,
            "passed": True,
            "summary_analysis": "Duplicate entries.",
            "requires_human_review": False,
            "provider_used": "groq:openai/gpt-oss-120b",
            "criterion_evaluations": [
                {
                    "criterion_id": str(self.criterion1.id),
                    "passed": True,
                    "score": 95,
                    "confidence": 0.95,
                    "explanation": "Entry A",
                    "evidence_match_snippet": "Intact ZIP",
                },
                {
                    "criterion_id": str(self.criterion1.id),  # duplicate!
                    "passed": True,
                    "score": 90,
                    "confidence": 0.90,
                    "explanation": "Entry B",
                    "evidence_match_snippet": "Intact ZIP",
                },
                {
                    "criterion_id": str(self.criterion2.id),
                    "passed": True,
                    "score": 90,
                    "confidence": 0.90,
                    "explanation": "Valid repo",
                    "evidence_match_snippet": "GitHub repo",
                },
            ],
        }

        with patch("app.services.ai_provider.evaluate_delivery_against_criteria", return_value=mock_duplicate_ai_eval):
            result = run_verification_orchestration(
                session=self.session,
                contract_id=self.contract.id,
                milestone_id=self.milestone.id,
                delivery_id=self.delivery.id,
                actor=self.freelancer_user,
            )

        evals_by_id = {ce["criterion_id"]: ce for ce in result["criterion_evaluations"]}
        dup_eval = evals_by_id.get(str(self.criterion1.id))
        self.assertIsNotNone(dup_eval)
        self.assertEqual(dup_eval["status"], CriterionStatus.NEEDS_REVIEW)
        self.assertIn("duplicate", dup_eval["explanation"].lower())

    def test_strict_boolean_string_false_is_not_passed(self):
        """String 'false' from AI JSON must strictly evaluate to False, not True."""
        mock_ai_eval = {
            "overall_score": 75,
            "passed": False,
            "summary_analysis": "One criterion failed.",
            "requires_human_review": True,
            "provider_used": "groq:openai/gpt-oss-120b",
            "criterion_evaluations": [
                {
                    "criterion_id": str(self.criterion1.id),
                    "passed": "false",  # string 'false'!
                    "score": 40,
                    "confidence": 0.85,
                    "explanation": "Incomplete deliverables",
                    "evidence_match_snippet": "Missing files",
                },
                {
                    "criterion_id": str(self.criterion2.id),
                    "passed": True,
                    "score": 90,
                    "confidence": 0.90,
                    "explanation": "Valid repo",
                    "evidence_match_snippet": "GitHub repo",
                },
            ],
        }

        with patch("app.services.ai_provider.evaluate_delivery_against_criteria", return_value=mock_ai_eval):
            result = run_verification_orchestration(
                session=self.session,
                contract_id=self.contract.id,
                milestone_id=self.milestone.id,
                delivery_id=self.delivery.id,
                actor=self.freelancer_user,
            )

        evals_by_id = {ce["criterion_id"]: ce for ce in result["criterion_evaluations"]}
        crit1_eval = evals_by_id.get(str(self.criterion1.id))
        self.assertIsNotNone(crit1_eval)
        self.assertFalse(crit1_eval["passed"])

    def test_evidence_loader_local_file_and_fallbacks(self):
        """evidence_loader safely reads local file, returns None for unknown or unconfigured supabase."""
        from app.services.verification.evidence_loader import load_evidence_bytes

        # 1. Real local file
        bytes_loaded = load_evidence_bytes(self.test_zip_path)
        self.assertIsNotNone(bytes_loaded)
        self.assertGreater(len(bytes_loaded), 0)

        # 2. Empty or None
        self.assertIsNone(load_evidence_bytes(""))
        self.assertIsNone(load_evidence_bytes(None))

        # 3. HTTP URL treated safely (not fetched by loader directly)
        self.assertIsNone(load_evidence_bytes("https://example.com/some_file.png"))

        # 4. Non-existent local file
        self.assertIsNone(load_evidence_bytes("non_existent_file_path_12345.bin"))



class TestPhase7TerminalJobState(unittest.TestCase):
    """Phase 7: Verifies that verification polling always resolves to a visible terminal state."""

    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        SQLModel.metadata.create_all(self.engine)
        self.session = Session(self.engine)

        self.client_user = UserProfile(
            id=uuid.uuid4(),
            email="client.term@trustbroker.ai",
            role="client",
            full_name="Terminal Client",
        )
        self.freelancer_user = UserProfile(
            id=uuid.uuid4(),
            email="freelancer.term@trustbroker.ai",
            role="freelancer",
            full_name="Terminal Freelancer",
        )
        self.contract = Contract(
            id=uuid.uuid4(),
            code="TB-TERM-001",
            title="Terminal State Contract",
            client_id=self.client_user.id,
            freelancer_id=self.freelancer_user.id,
            status=ContractStatus.ACTIVE,
            total_amount=Decimal("500.00"),
            currency="USD",
        )
        self.milestone = Milestone(
            id=uuid.uuid4(),
            contract_id=self.contract.id,
            title="Terminal Milestone",
            amount=Decimal("500.00"),
            status=MilestoneStatus.VERIFYING,
            payment_status=PaymentStatus.STAGED_IN_SANDBOX,
        )
        self.session.add(self.client_user)
        self.session.add(self.freelancer_user)
        self.session.add(self.contract)
        self.session.add(self.milestone)
        self.session.commit()

    def tearDown(self):
        self.session.close()

    def test_interrupted_state_when_verifying_times_out(self):
        """If a service restarted or timed out (>420s) while in VERIFYING, status endpoint reports 'interrupted'."""
        from datetime import datetime, timezone, timedelta
        from app.routers.deliveries import get_delivery_verification_status

        old_time = datetime.now(timezone.utc) - timedelta(seconds=480)
        delivery = Delivery(
            id=uuid.uuid4(),
            contract_id=self.contract.id,
            milestone_id=self.milestone.id,
            submitted_by=self.freelancer_user.id,
            description="Interrupted delivery",
            submitted_at=old_time,
        )
        self.session.add(delivery)
        self.session.commit()

        status_res = get_delivery_verification_status(
            delivery_id=delivery.id,
            current_user=self.client_user,
            session=self.session,
        )
        self.assertEqual(status_res["status"], "interrupted")
        self.assertIn("interrupted", status_res["error"].lower())

    def test_needs_review_state_when_submitted_fails_to_verify(self):
        """If a delivery was submitted >45s ago and reverted/stayed in SUBMITTED with no report, status is 'needs_review'."""
        from datetime import datetime, timezone, timedelta
        from app.routers.deliveries import get_delivery_verification_status

        self.milestone.status = MilestoneStatus.SUBMITTED
        self.session.add(self.milestone)
        self.session.commit()

        old_time = datetime.now(timezone.utc) - timedelta(seconds=60)
        delivery = Delivery(
            id=uuid.uuid4(),
            contract_id=self.contract.id,
            milestone_id=self.milestone.id,
            submitted_by=self.freelancer_user.id,
            description="Needs review delivery",
            submitted_at=old_time,
        )
        self.session.add(delivery)
        self.session.commit()

        status_res = get_delivery_verification_status(
            delivery_id=delivery.id,
            current_user=self.client_user,
            session=self.session,
        )
        self.assertEqual(status_res["status"], "needs_review")
        self.assertIn("human review", status_res["error"].lower())


if __name__ == "__main__":
    unittest.main()
