import uuid
from typing import Any, Dict, List, Optional
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlmodel import Session, select
from app.config import settings
from app.database import get_session
from app.models.user import UserProfile
from app.models.contract import Contract, ContractStatus


def decode_supabase_jwt(token: str) -> Dict[str, Any]:
    """Decode and cryptographically verify a Supabase Auth JWT token."""
    try:
        # Supabase signs access tokens with HMAC-SHA256 using the project JWT Secret
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        # Development fallback for test tokens
        if settings.environment == "development" and token.startswith("dev-user-"):
            user_role = token.replace("dev-user-", "")
            is_client = user_role == "client"
            return {
                "sub": "00000000-0000-0000-0000-000000000001" if is_client else "00000000-0000-0000-0000-000000000002",
                "email": "elena@acmeglobal.com" if is_client else "tariro@devstudio.co.zw",
                "user_metadata": {
                    "full_name": "Elena Rostova" if is_client else "Tariro Moyo",
                    "organization": "Acme Global Ventures LLC" if is_client else "DevStudio Zimbabwe",
                    "role": user_role,
                },
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired credentials: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
) -> UserProfile:
    """Dependency that extracts, verifies the Supabase JWT, and returns or upserts the UserProfile."""
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
        profile = UserProfile(
            id=user_id,
            email=email,
            full_name=full_name,
            organization=metadata.get("organization"),
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
        or (contract.freelancer_email is not None and contract.freelancer_email == user.email)
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
