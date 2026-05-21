# Esquemas Pydantic de notificaciones
from datetime import datetime

from pydantic import BaseModel

from app.features.notifications.models import NotificationType


class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
