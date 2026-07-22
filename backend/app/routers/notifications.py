"""
PillSync — Notifications Router
=================================
Endpoints:
  GET  /api/notifications/             - List all notifications for the logged-in user
  POST /api/notifications/mark-read    - Mark all (or specific) notifications as read
  POST /api/notifications/             - Create a notification (internal helper, admin use)
  GET  /api/notifications/unread-count - Return total unread count
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user_models import User, Notification
from app.services.auth_service import get_current_user
from app.schemas.notification_schemas import (
    NotificationResponse,
    NotificationCreate,
    MarkReadRequest,
    UnreadCountResponse,
)

logger = logging.getLogger("pillsync.notifications")

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all notifications for the logged-in user, newest first."""
    logger.info(f"[Notifications] GET list for user_id={current_user.id}")
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    logger.info(f"[Notifications] Returning {len(notifications)} notifications (user_id={current_user.id})")
    return notifications


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the number of unread notifications for the logged-in user."""
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .count()
    )
    logger.info(f"[Notifications] Unread count for user_id={current_user.id}: {count}")
    return {"unread_count": count}


@router.post("/mark-read", status_code=status.HTTP_200_OK)
def mark_notifications_read(
    payload: MarkReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark notifications as read.
    - If payload.notification_ids is empty → mark ALL as read.
    - If payload.notification_ids has values → mark only those IDs.
    """
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    )
    if payload.notification_ids:
        query = query.filter(Notification.id.in_(payload.notification_ids))

    updated = query.all()
    for n in updated:
        n.is_read = True
    db.commit()

    logger.info(f"[Notifications] Marked {len(updated)} notification(s) as read for user_id={current_user.id}")
    return {"marked_read": len(updated)}


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a notification entry.
    Used internally by other services (SMS, reminders) to log events.
    Only the current user's notifications can be created through this endpoint.
    """
    notif = Notification(
        user_id=current_user.id,
        title=payload.title,
        message=payload.message,
        type=payload.type,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    logger.info(f"[Notifications] Created notification id={notif.id} for user_id={current_user.id}")
    return notif
