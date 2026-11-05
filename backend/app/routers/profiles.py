import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.database import get_session
from app.models.user import UserProfile
from app.schemas.profile import ProfileRead, ProfileUpdateRequest
from app.services import profile_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/me", response_model=ProfileRead, summary="Get the signed-in client or freelancer profile")
def get_my_profile(current_user: UserProfile = Depends(get_current_user)):
    return profile_service.to_read(current_user)


@router.put("/me", response_model=ProfileRead, summary="Update profile, skills, portfolio and PayPal payout email")
def update_my_profile(
    req: ProfileUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return profile_service.update_profile(session, current_user, req)


@router.get(
    "/search",
    response_model=List[ProfileRead],
    summary="Search profiles by name or headline",
)
def search_profiles(
    q: str = Query(..., min_length=2, description="Search term — matches full_name or headline"),
    workspace: Optional[str] = Query(None, description="Filter by 'client' or 'freelancer'"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Search profiles for freelancer discovery and direct contract invitations.
    PayPal payout emails are masked in results for privacy.
    """
    _ = current_user  # authentication required
    results, _ = profile_service.search_profiles(session, q, workspace, page, per_page)
    return results


@router.get(
    "/{profile_id}",
    response_model=ProfileRead,
    summary="Get a public profile by ID",
)
def get_public_profile(
    profile_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Read-only public profile lookup. PayPal payout email is masked for privacy."""
    _ = current_user  # authentication required
    return profile_service.get_public_profile(session, profile_id)
