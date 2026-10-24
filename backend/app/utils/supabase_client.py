from typing import Optional
from supabase import create_client, Client
from app.config import settings

_supabase_admin_client: Optional[Client] = None


def get_supabase_admin() -> Optional[Client]:
    """Retrieve or initialize the Supabase Admin client with service_role privileges."""
    global _supabase_admin_client
    if _supabase_admin_client is None:
        if settings.supabase_url and settings.supabase_service_role_key:
            try:
                _supabase_admin_client = create_client(
                    settings.supabase_url,
                    settings.supabase_service_role_key,
                )
            except Exception as e:
                print(f"Warning: Could not initialize Supabase admin client: {e}")
                return None
    return _supabase_admin_client


def get_signed_download_url(bucket: str, path: str, expires_in: int = 3600) -> Optional[str]:
    """Generate a time-limited signed download URL for private deliverables."""
    client = get_supabase_admin()
    if not client:
        return None
    try:
        res = client.storage.from_(bucket).create_signed_url(path, expires_in)
        return res.get("signedURL") or res.get("signedUrl")
    except Exception as e:
        print(f"Error creating signed download URL: {e}")
        return None


def get_signed_upload_url(bucket: str, path: str) -> Optional[dict]:
    """Generate a signed upload URL to allow direct browser-to-Supabase uploads."""
    client = get_supabase_admin()
    if not client:
        return None
    try:
        return client.storage.from_(bucket).create_signed_upload_url(path)
    except Exception as e:
        print(f"Error creating signed upload URL: {e}")
        return None
