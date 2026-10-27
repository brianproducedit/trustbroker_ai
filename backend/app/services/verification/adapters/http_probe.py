"""
HTTP Probe Adapter for Live Staging & Deployed Web URLs.
Probes reachable status, HTTP status code, TLS security, page title, and latency.
"""
import re
import time
from typing import Any, Dict, Optional
import httpx


def probe_live_url(url: str, timeout: float = 8.0) -> Dict[str, Any]:
    """Execute live HTTP check against target staging URL.
    
    Verifies:
    1. Host reachability and DNS resolution
    2. TLS / HTTPS protocol
    3. HTTP status code (200 OK vs 404, 500, etc.)
    4. HTML page title extraction
    5. Latency (ms)
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
            "error": "No live URL provided in submission.",
            "citation": "Missing URL",
        }

    if not clean_url.startswith(("http://", "https://")):
        clean_url = "https://" + clean_url

    is_tls = clean_url.startswith("https://")
    start_t = time.time()

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TrustBrokerAI-Probe/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        with httpx.Client(follow_redirects=True, timeout=timeout, verify=True) as client:
            resp = client.get(clean_url, headers=headers)
            elapsed_ms = round((time.time() - start_t) * 1000, 1)

            # Extract <title> if HTML
            title = None
            text = resp.text[:10000] if resp.text else ""
            match = re.search(r"<title[^>]*>([^<]+)</title>", text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()

            is_ok = (resp.status_code >= 200 and resp.status_code < 400)
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
                "error": None if is_ok else f"Returned HTTP status {resp.status_code}",
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
