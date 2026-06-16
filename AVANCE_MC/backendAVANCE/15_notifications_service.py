# Logica del feature de notificaciones
# En esta version educativa solo se registran en la base de datos
# (no se envian correos reales para mantener la simplicidad)
from sqlalchemy.orm import Session

from app.features.notifications.models import Notification, NotificationType


def create_notification(
    db: Session,
    user_id: int,
    notif_type: NotificationType,
    title: str,
    message: str,
) -> Notification:
    """Registra una nueva notificacion para el usuario indicado."""
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def list_notifications(db: Session, user_id: int):
    """Lista las notificaciones del usuario actual."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
    """Marca una notificacion como leida."""
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not notification:
        return None
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
