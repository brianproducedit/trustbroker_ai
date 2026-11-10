"""
HTTP Probe Adapter for Live Staging & Deployed Web URLs.
Probes reachable status, HTTP status code, TLS security, page title and latency.
Enforces strict SSRF protection and hop-by-hop redirect revalidation.
"""
import re
import time
import urllib.parse
from typing import Any, Dict, Optional
import httpx

from app.services.verification.safety import validate_url_for_ssrf


def probe_live_url(url: str, timeout: float = 8.0) -> Dict[str, Any]:
    """Execute live HTTP check against target staging URL.
    
    Verifies:
    1. SSRF safety: blocks private, loopback, link-local and cloud metadata targets
    2. Host reachability and DNS resolution
    3. TLS / HTTPS protocol
    4. HTTP status code (200 OK vs 404, 500, edge challenge)
    5. HTML page title extraction (bounded)
    6. Latency (ms)
    """
    clean_url = (url or "").strip()
    if not clean_url:
        return {
            "reachable": False,
            "status_code": None,
            "is_tls": False,
            "title": None,
            "response_time_ms": 0.0,
            "passed": False,
            "needs_review": False,
            "error": "No live URL provided in submission.",
            "citation": "Missing URL",
        }

    if not clean_url.startswith(("http://", "https://")):
        clean_url = "https://" + clean_url

    # 1. Pre-flight SSRF Validation
    is_safe, ssrf_err, parsed, _ = validate_url_for_ssrf(clean_url)
    if not is_safe:
        return {
            "reachable": False,
            "status_code": None,
            "is_tls": clean_url.startswith("https://"),
            "title": None,
            "response_time_ms": 0.0,
            "passed": False,
            "needs_review": False,
            "error": ssrf_err or "URL failed SSRF safety checks.",
            "citation": f"Security Blocked: {ssrf_err[:60] if ssrf_err else 'SSRF Protection'}",
        }

    is_tls = clean_url.startswith("https://")
    start_t = time.time()

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    current_url = clean_url
    max_redirects = 4

    try:
        with httpx.Client(follow_redirects=False, timeout=timeout, verify=True) as client:
            resp = None
            for hop in range(max_redirects + 1):
                # Re-validate SSRF on every redirect hop
                if hop > 0:
                    hop_safe, hop_err, _, _ = validate_url_for_ssrf(current_url)
                    if not hop_safe:
                        elapsed_ms = round((time.time() - start_t) * 1000, 1)
                        return {
                            "reachable": False,
                            "status_code": None,
                            "is_tls": current_url.startswith("https://"),
                            "title": None,
                            "response_time_ms": elapsed_ms,
                            "passed": False,
                            "needs_review": False,
                            "error": f"Redirect blocked by SSRF filter: {hop_err}",
                            "citation": f"Redirect Blocked: {hop_err[:50] if hop_err else 'SSRF'}",
                        }

                resp = client.get(current_url, headers=headers)
                
                # Check for redirects
                if resp.status_code in (301, 302, 303, 307, 308):
                    location = resp.headers.get("location")
                    if not location:
                        break
                    current_url = urllib.parse.urljoin(current_url, location)
                    if hop == max_redirects:
                        elapsed_ms = round((time.time() - start_t) * 1000, 1)
                        return {
                            "reachable": True,
                            "status_code": resp.status_code,
                            "is_tls": current_url.startswith("https://"),
                            "title": None,
                            "response_time_ms": elapsed_ms,
                            "passed": False,
                            "needs_review": True,
                            "error": f"Too many redirects (exceeded limit of {max_redirects}).",
                            "citation": f"Redirect Loop (HTTP {resp.status_code})",
                        }
                    continue
                else:
                    # Non-redirect response reached
                    break

            if resp is None:
                raise httpx.RequestError("No response received from target host.")

            elapsed_ms = round((time.time() - start_t) * 1000, 1)
            is_tls = current_url.startswith("https://")

            # Extract <title> if HTML (bounded to 10k chars)
            title = None
            text = resp.text[:10000] if resp.text else ""
            match = re.search(r"<title[^>]*>([^<]+)</title>", text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()

            is_ok = (200 <= resp.status_code < 400)
            needs_review = False
            error_msg = None

            # Edge / Bot challenge handling (401, 403, 429)
            # A CDN challenge page is evidence of edge protection, not proof that the requested
            # functional feature works. Mark as NEEDS_REVIEW so human reviewer can verify.
            if not is_ok and resp.status_code in (401, 403, 429):
                needs_review = True
                is_ok = False
                title = title or f"Edge Protection Active (HTTP {resp.status_code})"
                error_msg = f"HTTP {resp.status_code} received (edge bot-protection active; requires manual review)"
            elif not is_ok:
                error_msg = f"Returned HTTP status {resp.status_code}"

            citation = f"HTTP {resp.status_code} ({elapsed_ms}ms"
            if is_tls:
                citation += ", HTTPS/TLS"
            if title:
                citation += f", Title: '{title[:45]}'"
            citation += ")"

            return {
                "reachable": True,
                "status_code": resp.status_code,
                "is_tls": is_tls,
                "title": title,
                "response_time_ms": elapsed_ms,
                "passed": is_ok,
                "needs_review": needs_review,
                "error": error_msg,
                "citation": citation,
            }

    except httpx.ConnectTimeout:
        elapsed_ms = round((time.time() - start_t) * 1000, 1)
        return {
            "reachable": False,
            "status_code": None,
            "is_tls": is_tls,
            "title": None,
            "response_time_ms": elapsed_ms,
            "passed": False,
            "error": "Connection timed out. Host did not respond within 8 seconds.",
            "citation": f"Timeout after {elapsed_ms}ms",
        }
    except httpx.ConnectError as e:
        elapsed_ms = round((time.time() - start_t) * 1000, 1)
        return {
            "reachable": False,
            "status_code": None,
            "is_tls": is_tls,
            "title": None,
            "response_time_ms": elapsed_ms,
            "passed": False,
            "error": f"Failed to connect to host: {e}",
            "citation": "DNS/Connection Error",
        }
    except Exception as e:
        elapsed_ms = round((time.time() - start_t) * 1000, 1)
        return {
            "reachable": False,
            "status_code": None,
            "is_tls": is_tls,
            "title": None,
            "response_time_ms": elapsed_ms,
            "passed": False,
            "error": f"Probe error: {str(e)}",
            "citation": f"Error: {type(e).__name__}",
        }
