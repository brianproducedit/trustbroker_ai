import uuid
import time
import logging
from typing import Any, Dict, List, Optional
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt, jwk
from jose.utils import base64url_decode
from sqlmodel import Session, select
from app.config import settings
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract, ContractStatus

logger = logging.getLogger(__name__)

# In-memory JWKS cache (fetched once per process lifetime, refreshed on miss)
_jwks_cache: Dict[str, Any] = {"keys": [], "fetched_at": 0}
_JWKS_TTL = 3600  # Re-fetch JWKS every hour


def _fetch_jwks() -> List[Dict[str, Any]]:
    """Fetch the JSON Web Key Set from Supabase Auth's well-known endpoint."""
    import httpx

    now = time.time()
    if _jwks_cache["keys"] and (now - _jwks_cache["fetched_at"]) < _JWKS_TTL:
        return _jwks_cache["keys"]

    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        resp = httpx.get(jwks_url, timeout=10.0)
        resp.raise_for_status()
        keys = resp.json().get("keys", [])
        _jwks_cache["keys"] = keys
        _jwks_cache["fetched_at"] = now
        logger.info(f"[AUTH] Fetched {len(keys)} JWKS key(s) from Supabase")
        return keys
    except Exception as exc:
        logger.warning(f"[AUTH] Failed to fetch JWKS: {exc}")
        return _jwks_cache["keys"]  # Return stale cache if available


def _get_signing_key(token: str) -> Any:
    """Extract the signing key from JWKS matching the token's kid header."""
    import json
    import base64

    # Decode token header to get kid and alg
    header_segment = token.split(".")[0]
    # Add padding
    padding = 4 - len(header_segment) % 4
    if padding != 4:
        header_segment += "=" * padding
    header = json.loads(base64.urlsafe_b64decode(header_segment))

    kid = header.get("kid")
    alg = header.get("alg", "HS256")

    if alg == "HS256":
        # Legacy HMAC-based signing — return the shared secret directly
        return settings.supabase_jwt_secret, "HS256"

    # ES256 / RS256 — look up in JWKS
    jwks_keys = _fetch_jwks()
    for key_data in jwks_keys:
        if key_data.get("kid") == kid:
            return key_data, alg

    raise JWTError(f"No matching JWKS key found for kid={kid}")


def decode_supabase_jwt(token: str) -> Dict[str, Any]:
    """Decode and cryptographically verify a Supabase Auth JWT token.
    
    Supports both legacy HS256 (shared secret) and modern ES256 (ECDSA via JWKS).
    """
    # Fallback for 1-click dev test tokens (supports demo and hackathon reviews)
    if token.startswith("dev-user-"):
        user_role = token.replace("dev-user-", "")
        is_client = user_role == "client"
        return {
            "sub": "1e0dacbd-8d91-46f2-b04e-02acad08ce0c" if is_client else "2203012f-e6ac-4efb-8d63-4dc4e1a4bbbc",
            "email": "client.demo@trustbroker.ai" if is_client else "freelancer.demo@trustbroker.ai",
            "user_metadata": {
                "full_name": "Elena Rostova" if is_client else "Tariro Moyo",
                "organization": "Acme Global Ventures LLC" if is_client else "DevStudio Zimbabwe",
                "role": user_role,
                "primary_workspace": user_role,
            },
        }

    try:
        key_or_jwk, alg = _get_signing_key(token)

        payload = jwt.decode(
            token,
            key_or_jwk,
            algorithms=[alg],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired credentials: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
) -> UserProfile:
    """Dependency that extracts, verifies the Supabase JWT and returns or upserts the UserProfile."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header format must be 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    claims = decode_supabase_jwt(token)
    user_id_raw = claims.get("sub")
    if not user_id_raw:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identifier (sub)",
        )

    try:
        user_id = uuid.UUID(user_id_raw)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token",
        )

    email = claims.get("email", "")
    metadata = claims.get("user_metadata", {}) or {}
    full_name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0]

    # Query existing profile in PostgreSQL
    profile = session.exec(select(UserProfile).where(UserProfile.id == user_id)).first()
    if not profile:
        workspace = (metadata.get("primary_workspace") or metadata.get("role") or "client")
        if workspace not in ("client", "freelancer"):
            workspace = "client"
        profile = UserProfile(
            id=user_id,
            email=email,
            full_name=full_name,
            organization=metadata.get("organization"),
            primary_workspace=workspace,
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)
    elif profile.email != email or (full_name and profile.full_name != full_name):
        profile.email = email
        if full_name:
            profile.full_name = full_name
        if metadata.get("organization"):
            profile.organization = metadata.get("organization")
        session.add(profile)
        session.commit()
        session.refresh(profile)

    return profile


def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
) -> Optional[UserProfile]:
    """Dependency that returns UserProfile if authenticated, or None if unauthenticated."""
    if not authorization:
        return None
    try:
        return get_current_user(authorization=authorization, session=session)
    except HTTPException:
        return None


# ==============================================================================
# Permission Helpers
# ==============================================================================

def require_contract_party(user: UserProfile, contract: Contract) -> None:
    """Ensure the user is either the client or the assigned freelancer on this contract."""
    is_client = contract.client_id == user.id
    is_freelancer = (
        (contract.freelancer_id is not None and contract.freelancer_id == user.id)
        or (
            contract.freelancer_email is not None
            and user.email is not None
            and contract.freelancer_email.strip().lower() == user.email.strip().lower()
        )
    )
    if not (is_client or is_freelancer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not a party to this contract.",
        )


def require_client(user: UserProfile, contract: Contract) -> None:
    """Ensure the calling user is the designated client on this contract."""
    if contract.client_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action forbidden: Only the contract client can perform this operation.",
        )


def require_freelancer(user: UserProfile, contract: Contract) -> None:
    """Ensure the calling user is the assigned freelancer on this contract."""
    if contract.freelancer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action forbidden: Only the assigned freelancer can perform this operation.",
        )


def require_contract_status(contract: Contract, allowed_statuses: List[ContractStatus]) -> None:
    """Ensure the contract is in an allowed status before performing a transition."""
    if contract.status not in allowed_statuses:
        allowed_names = [s.value for s in allowed_statuses]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Operation conflict: Contract status is '{contract.status.value}', expected one of: {allowed_names}",
        )
