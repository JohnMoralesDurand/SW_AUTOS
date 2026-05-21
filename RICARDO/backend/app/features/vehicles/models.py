# Modelo ORM del vehiculo asociado a un cliente
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Vehicle(Base):
    # Tabla de vehiculos del taller
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Datos basicos del vehiculo
    license_plate = Column(String(10), unique=True, nullable=False, index=True)
    brand = Column(String(60), nullable=False)
    model = Column(String(60), nullable=False)
    year = Column(Integer, nullable=False)
    mileage = Column(Integer, default=0, nullable=False)
    color = Column(String(30), nullable=True)

    # Estado y auditoria
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones con otras tablas
    owner = relationship("User", backref="vehicles")
