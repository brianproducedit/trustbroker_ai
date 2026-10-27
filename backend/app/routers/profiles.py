from fastapi import APIRouter, Depends
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


@router.put("/me", response_model=ProfileRead, summary="Update profile, skills, portfolio, and PayPal payout email")
def update_my_profile(
    req: ProfileUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return profile_service.update_profile(session, current_user, req)
