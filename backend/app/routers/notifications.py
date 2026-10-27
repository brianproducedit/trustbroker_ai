import uuid
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.database import get_session
from app.models.user import UserProfile
from app.schemas.marketplace import NotificationListResponse, NotificationRead
from app.services import notification_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse, summary="List notifications for the signed-in user")
def list_notifications(
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    items, total, unread_count = notification_service.list_notifications(
        session=session,
        user=current_user,
        unread_only=unread_only,
        page=page,
        per_page=per_page,
    )
    return NotificationListResponse(notifications=items, unread_count=unread_count, total=total)


@router.post("/{notification_id}/read", response_model=NotificationRead, summary="Mark one notification as read")
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return notification_service.mark_read(session, current_user, notification_id)


@router.post("/read-all", summary="Mark all notifications as read")
def mark_all_read(
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    updated = notification_service.mark_all_read(session, current_user)
    return {"updated": updated}
