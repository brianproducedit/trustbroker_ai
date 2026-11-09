"""
TrustBroker AI — Workstream M: SSRF and External URL Safety Tests
Verifies that:
- Localhost, 127.0.0.1, ::1 are blocked
- Cloud metadata service (169.254.169.254) is blocked
- Private IPv4/IPv6 networks (RFC1918, link-local) are blocked
- Embedded user credentials (user:pass@) are blocked
- Unsupported schemes (file, ftp, gopher) are blocked
- Non-standard ports (22, 25, 3306, 5432) are blocked
- Live probe rejects SSRF targets before making network connections
- Repo metadata inspection does not invent fake files on rate limits or pass uninspected GitLab URLs
"""
import unittest
from unittest.mock import patch, MagicMock

from app.services.verification.safety import validate_url_for_ssrf, is_ip_blocked
from app.services.verification.adapters.http_probe import probe_live_url
from app.services.verification.adapters.repo_meta import inspect_repository


class TestSSRFProtection(unittest.TestCase):
    def test_localhost_and_loopback_blocked(self):
        blocked_urls = [
            "http://localhost:8000/api/v1/users",
            "http://127.0.0.1:8000/health",
            "http://127.0.0.2:80",
            "http://[::1]/secret",
            "http://0.0.0.0:80",
        ]
        for url in blocked_urls:
            safe, err, _, _ = validate_url_for_ssrf(url)
            self.assertFalse(safe, f"Expected {url} to be blocked by SSRF filter")
            self.assertIsNotNone(err)

    def test_cloud_metadata_service_blocked(self):
        metadata_urls = [
            "http://169.254.169.254/latest/meta-data/",
            "http://instance-data/latest/meta-data",
            "http://metadata.google.internal/computeMetadata/v1/",
        ]
        for url in metadata_urls:
            safe, err, _, _ = validate_url_for_ssrf(url)
            self.assertFalse(safe, f"Expected metadata URL {url} to be blocked")

    def test_private_networks_blocked(self):
        private_urls = [
            "http://10.0.0.1:8080/admin",
            "http://172.16.5.10:80/internal",
            "http://192.168.1.1/router",
        ]
        for url in private_urls:
            safe, err, _, _ = validate_url_for_ssrf(url)
            self.assertFalse(safe, f"Expected private network {url} to be blocked")

    def test_embedded_credentials_blocked(self):
        url = "https://admin:secret123@example.com/dashboard"
        safe, err, _, _ = validate_url_for_ssrf(url)
        self.assertFalse(safe)
        self.assertIn("credentials", err.lower())

    def test_non_http_schemes_blocked(self):
        schemes = [
            "file:///etc/passwd",
            "ftp://ftp.example.com/file.txt",
            "gopher://gopher.example.com",
            "data:text/html,<html>malicious</html>",
        ]
        for url in schemes:
            safe, err, _, _ = validate_url_for_ssrf(url)
            self.assertFalse(safe, f"Expected scheme for {url} to be blocked")

    def test_non_standard_ports_blocked(self):
        bad_ports = [
            "http://example.com:22",
            "http://example.com:3306",
            "http://example.com:5432",
            "http://example.com:25",
        ]
        for url in bad_ports:
            safe, err, _, _ = validate_url_for_ssrf(url)
            self.assertFalse(safe, f"Expected bad port for {url} to be blocked")

    def test_http_probe_blocks_ssrf_before_request(self):
        res = probe_live_url("http://127.0.0.1:8000/internal-admin")
        self.assertFalse(res["reachable"])
        self.assertFalse(res["passed"])
        self.assertIn("Security Blocked", res["citation"])

    def test_repo_meta_gitlab_needs_review(self):
        res = inspect_repository("https://gitlab.com/company/project")
        self.assertFalse(res["passed"])
        self.assertTrue(res["needs_review"])

    def test_repo_meta_rate_limit_needs_review_not_fake_pass(self):
        with patch("httpx.Client.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 403
            mock_get.return_value = mock_resp

            res = inspect_repository("https://github.com/mock-owner-for-test/mock-repo-rate-limit-check")
            self.assertFalse(res["passed"])
            self.assertTrue(res["needs_review"])
            self.assertEqual(res["files_found"], [])
            self.assertIsNone(res["readme_snippet"])

