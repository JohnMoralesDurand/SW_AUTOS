# Modelo ORM del usuario del sistema (clientes, mecanicos y administradores)
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    # Roles disponibles en el sistema
    CLIENT = "client"
    MECHANIC = "mechanic"
    ADMIN = "admin"


class User(Base):
    # Tabla principal de usuarios
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    dni = Column(String(8), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)

    # Campos especificos para mecanicos
    specialty = Column(String(80), nullable=True)
    work_schedule = Column(String(120), nullable=True)

    # Estado y auditoria
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
