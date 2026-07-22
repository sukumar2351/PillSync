"""
Pydantic schemas for the Notifications feature.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "system"   # "reminder" | "sms" | "browser" | "system"


class MarkReadRequest(BaseModel):
    notification_ids: Optional[List[int]] = []  # empty = mark all


class UnreadCountResponse(BaseModel):
    unread_count: int
