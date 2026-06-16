# Modelo ORM de las citas del taller
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Float, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class AppointmentStatus(str, enum.Enum):
    # Estados validos segun la regla RN-09
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Appointment(Base):
    # Tabla principal de citas
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    # Relaciones con cliente, vehiculo, servicio y mecanico asignado
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    mechanic_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Datos de la cita
    scheduled_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False)
    # Precio congelado al momento de la reserva (RN-11)
    frozen_price = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)

    # Estado y motivo de cancelacion
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING, nullable=False)
    cancellation_reason = Column(String(255), nullable=True)
    is_late_cancellation = Column(String(5), default="false")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones de SQLAlchemy
    client = relationship("User", foreign_keys=[client_id])
    mechanic = relationship("User", foreign_keys=[mechanic_id])
    vehicle = relationship("Vehicle")
    service = relationship("Service")
