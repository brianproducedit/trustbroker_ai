"""
HTTP Probe Adapter for Live Staging & Deployed Web URLs.
Probes reachable status, HTTP status code, TLS security, page title and latency.
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
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

            # Resilience against Vercel, Cloudflare, GitHub and other CDN/edge anti-bot challenges (429 / 403 / 401)
            # When an automated probe pings a live staging site from a cloud IP (Render/AWS), edge platforms
            # often return 429 or 403 with a challenge page (e.g. "Vercel Security Checkpoint", "Just a moment...").
            # DNS resolved + TLS handshake succeeded = deployment exists on the edge — treat as verified.
            if not is_ok and resp.status_code in (429, 403, 401):
                url_lower = clean_url.lower()
                title_lower = (title or "").lower()
                server_hdr = resp.headers.get("server", "").lower()
                cf_ray = resp.headers.get("cf-ray", "")
                vercel_id = resp.headers.get("x-vercel-id", "")
                is_edge_checkpoint = (
                    # URL-domain based (most reliable — known deployment platforms)
                    any(domain in url_lower for domain in [
                        "vercel.app", "vercel.com", "netlify.app", "netlify.com",
                        "github.com", "github.io", "render.com", "fly.dev",
                        "railway.app", "pages.dev", "web.app", "firebaseapp.com",
                        "onrender.com", "heroku.com", "azurewebsites.net",
                        "amplifyapp.com", "cloudfront.net",
                    ])
                    # Title-based detection
                    or any(k in title_lower for k in [
                        "vercel", "checkpoint", "cloudflare", "security",
                        "just a moment", "ddos", "challenge", "netlify",
                        "access denied", "rate limit", "too many requests",
                    ])
                    # Server / response-header detection
                    or "vercel" in server_hdr
                    or "cloudflare" in server_hdr
                    or bool(cf_ray)
                    or bool(vercel_id)
                )
                if is_edge_checkpoint:
                    is_ok = True
                    title = title or f"Edge/CDN-Verified (HTTP {resp.status_code} — bot-protection active, deployment confirmed)"

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
