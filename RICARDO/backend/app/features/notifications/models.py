# Modelo ORM de notificaciones del sistema
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Boolean

from app.core.database import Base


class NotificationType(str, enum.Enum):
    # Tipos de notificaciones que envia el sistema
    APPOINTMENT_BOOKED = "appointment_booked"
    APPOINTMENT_REMINDER = "appointment_reminder"
    STATUS_CHANGED = "status_changed"
    SERVICE_COMPLETED = "service_completed"


class Notification(Base):
    # Tabla de notificaciones (registro local)
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
