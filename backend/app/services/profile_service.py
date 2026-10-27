from datetime import datetime, timezone
from app.models.user import UserProfile
from app.schemas.profile import ProfileRead, ProfileUpdateRequest
from sqlmodel import Session


ALLOWED_WORKSPACES = {"client", "freelancer"}


def compute_profile_completeness(profile: UserProfile) -> int:
    score = 0
    if (profile.full_name or "").strip():
        score += 15
    if (profile.headline or "").strip():
        score += 10
    if (profile.bio or "").strip() and len(profile.bio.strip()) >= 40:
        score += 15
    if profile.skills:
        score += 15
    if profile.portfolio:
        score += 20
    if (profile.paypal_payout_email or "").strip():
        score += 15
    if (profile.organization or "").strip():
        score += 10
    return min(100, score)


def to_read(profile: UserProfile) -> ProfileRead:
    return ProfileRead.model_validate(profile)


def update_profile(session: Session, profile: UserProfile, req: ProfileUpdateRequest) -> ProfileRead:
    if req.full_name is not None:
        profile.full_name = req.full_name
    if req.organization is not None:
        profile.organization = req.organization
    if req.headline is not None:
        profile.headline = req.headline
    if req.bio is not None:
        profile.bio = req.bio
    if req.skills is not None:
        profile.skills = [s.strip() for s in req.skills if s and s.strip()]
    if req.portfolio is not None:
        profile.portfolio = req.portfolio
    if req.paypal_payout_email is not None:
        email = req.paypal_payout_email.strip()
        profile.paypal_payout_email = email or None
    if req.primary_workspace is not None:
        workspace = req.primary_workspace.strip().lower()
        if workspace not in ALLOWED_WORKSPACES:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="primary_workspace must be 'client' or 'freelancer'")
        profile.primary_workspace = workspace

    profile.profile_completeness = compute_profile_completeness(profile)
    profile.updated_at = datetime.now(timezone.utc)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return to_read(profile)
