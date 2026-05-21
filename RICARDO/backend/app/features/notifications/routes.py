# Endpoints HTTP del feature de notificaciones
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.features.notifications import service
from app.features.notifications.schemas import NotificationOut
from app.features.users.models import User


router = APIRouter(prefix="/api/notifications", tags=["Notificaciones"])


@router.get("", response_model=list[NotificationOut])
def list_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista las notificaciones del usuario autenticado."""
    return service.list_notifications(db, current_user.id)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca la notificacion como leida."""
    return service.mark_as_read(db, notification_id, current_user.id)
