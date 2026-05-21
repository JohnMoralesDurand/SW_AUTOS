# Modelo ORM del catalogo de servicios del taller
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text

from app.core.database import Base


class Service(Base):
    # Tabla del catalogo de servicios disponibles
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(60), nullable=True)

    # Duracion en minutos y precio en soles
    duration_minutes = Column(Integer, nullable=False, default=60)
    price = Column(Float, nullable=False, default=0.0)

    # Estado y auditoria
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
