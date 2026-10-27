import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException
from sqlmodel import Session, select, func, col
from app.models.marketplace import Notification
from app.models.user import UserProfile
from app.schemas.marketplace import NotificationRead


def queue_notification(
    session: Session,
    user_id: uuid.UUID,
    type: str,
    title: str,
    body: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[uuid.UUID] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    session.add(notification)
    return notification


def to_read(n: Notification) -> NotificationRead:
    return NotificationRead.model_validate(n)


def list_notifications(
    session: Session,
    user: UserProfile,
    unread_only: bool = False,
    page: int = 1,
    per_page: int = 50,
) -> Tuple[List[NotificationRead], int, int]:
    filters = [Notification.user_id == user.id]
    if unread_only:
        filters.append(col(Notification.read_at).is_(None))

    count_stmt = select(func.count(Notification.id)).where(*filters)
    total = session.exec(count_stmt).one()

    unread_stmt = select(func.count(Notification.id)).where(
        Notification.user_id == user.id,
        col(Notification.read_at).is_(None),
    )
    unread_count = session.exec(unread_stmt).one()

    stmt = (
        select(Notification)
        .where(*filters)
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    rows = list(session.exec(stmt).all())
    return [to_read(n) for n in rows], int(total), int(unread_count)


def mark_read(session: Session, user: UserProfile, notification_id: uuid.UUID) -> NotificationRead:
    notification = session.get(Notification, notification_id)
    if not notification or notification.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        session.add(notification)
        session.commit()
        session.refresh(notification)
    return to_read(notification)


def mark_all_read(session: Session, user: UserProfile) -> int:
    stmt = select(Notification).where(
        Notification.user_id == user.id,
        col(Notification.read_at).is_(None),
    )
    rows = list(session.exec(stmt).all())
    now = datetime.now(timezone.utc)
    for n in rows:
        n.read_at = now
        session.add(n)
    session.commit()
    return len(rows)
