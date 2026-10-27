import uuid
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.database import get_session
from app.models.user import UserProfile
from app.schemas.contract import ContractRead
from app.schemas.marketplace import ApplicationListResponse, ApplicationRead
from app.services import marketplace_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/mine", response_model=ApplicationListResponse, summary="Freelancer application statuses")
def list_my_applications(
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    applications, total = marketplace_service.list_my_applications(session, current_user)
    return ApplicationListResponse(applications=applications, total=total)


@router.post(
    "/{application_id}/award",
    response_model=ContractRead,
    summary="Client awards a freelancer application",
)
def award_application(
    application_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Only the contract client may award. Other applications become rejected and both sides are notified."""
    return marketplace_service.award_application(
        session=session,
        application_id=application_id,
        client=current_user,
    )


@router.post(
    "/{application_id}/shortlist",
    response_model=ApplicationRead,
    summary="Client shortlists a freelancer without awarding",
)
def shortlist_application(
    application_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return marketplace_service.shortlist_application(session, application_id, current_user)
