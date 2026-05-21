# Modelo ORM de la configuración de horarios de atención del taller
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime

from app.core.database import Base


class BusinessHours(Base):
    """Horario de atención del taller para un día de la semana.

    Cada fila representa un día (0=Lunes, 6=Domingo) y guarda si el taller
    está abierto y los horarios de apertura/cierre. El módulo de citas usa
    esta tabla para validar reservas y calcular slots disponibles (RN-03).
    """

    __tablename__ = "business_hours"

    id = Column(Integer, primary_key=True, index=True)

    # Día de la semana: 0=Lunes ... 6=Domingo
    day_of_week = Column(Integer, nullable=False, unique=True, index=True)

    # Si el taller atiende ese día
    is_open = Column(Boolean, default=True, nullable=False)

    # Horarios en formato "HH:MM" (texto simple para evitar zonas horarias)
    open_time = Column(String(5), nullable=False, default="08:00")
    close_time = Column(String(5), nullable=False, default="18:00")

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
