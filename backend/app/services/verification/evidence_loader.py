"""
Evidence Loader — fetches delivery file bytes from storage backends.

Supports:
  - supabase://delivery-evidence/<path>  → Supabase Storage SDK download
  - Local filesystem paths               → direct file read
  - Unknown / unavailable                → returns None (safe fallback)

Never performs SSRF, URL redirection or private-network requests.
"""
import io
import logging
import os
from typing import Optional

logger = logging.getLogger("trustbroker.verification.evidence_loader")

SUPABASE_SCHEME = "supabase://delivery-evidence/"


def load_evidence_bytes(storage_path: str) -> Optional[bytes]:
    """
    Load raw bytes for a delivery evidence file.

    Returns bytes on success, None if unavailable or unsupported.
    Callers MUST treat None as NEEDS_REVIEW — never auto-pass.
    """
    if not storage_path:
        logger.warning("evidence_loader: empty storage_path provided")
        return None

    # 1. Supabase Storage path
    if storage_path.startswith(SUPABASE_SCHEME):
        return _load_from_supabase(storage_path)

    # 2. Local filesystem path (dev/test only)
    if os.path.isfile(storage_path):
        try:
            with open(storage_path, "rb") as f:
                return f.read()
        except Exception as exc:
            logger.warning(f"evidence_loader: failed to read local file {storage_path}: {exc}")
            return None

    # 3. HTTP/HTTPS signed URL — treat as opaque, do not fetch (SSRF risk)
    if storage_path.startswith(("http://", "https://")):
        logger.info(
            f"evidence_loader: HTTP(S) path received; returning None to let vision adapter "
            f"handle URL directly via allowed image_source mechanism: {storage_path[:80]}"
        )
        return None

    logger.warning(f"evidence_loader: unrecognized storage_path scheme: {storage_path[:80]}")
    return None


def _load_from_supabase(storage_path: str) -> Optional[bytes]:
    """Download bytes from Supabase Storage using the Python SDK."""
    try:
        from supabase import create_client, Client  # type: ignore
        from app.config import settings
    except ImportError:
        logger.warning("evidence_loader: supabase-py not installed — cannot load Supabase evidence")
        return None

    if not getattr(settings, "supabase_url", None) or not getattr(settings, "supabase_service_role_key", None):
        logger.warning("evidence_loader: Supabase credentials not configured — cannot load evidence")
        return None

    # Strip prefix to get bucket-relative path
    relative_path = storage_path[len(SUPABASE_SCHEME):]
    # relative_path is like "<user-id>/<file-id>_<filename>"
    bucket = "delivery-evidence"

    try:
        client: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        response = client.storage.from_(bucket).download(relative_path)
        if isinstance(response, (bytes, bytearray)):
            logger.info(f"evidence_loader: loaded {len(response)} bytes from Supabase: {relative_path[:60]}")
            return bytes(response)
        logger.warning(f"evidence_loader: unexpected response type from Supabase download: {type(response)}")
        return None
    except Exception as exc:
        logger.warning(f"evidence_loader: Supabase download failed for {relative_path}: {exc}")
        return None
