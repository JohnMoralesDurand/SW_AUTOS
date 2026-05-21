# Esquemas Pydantic del feature de usuarios
# Definen la forma de los datos de entrada y salida del API
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.features.users.models import UserRole


class UserBase(BaseModel):
    # Campos comunes de entrada para usuarios
    first_name: str = Field(..., min_length=2, max_length=80)
    last_name: str = Field(..., min_length=2, max_length=80)
    dni: str = Field(..., min_length=8, max_length=8, pattern=r"^\d{8}$")
    email: EmailStr
    phone: Optional[str] = None


class UserCreate(UserBase):
    # Datos requeridos para registrar un cliente
    password: str = Field(..., min_length=6, max_length=80)


class MechanicCreate(UserBase):
    # Datos requeridos para registrar un mecanico (lo crea el administrador)
    password: str = Field(..., min_length=6, max_length=80)
    specialty: Optional[str] = None
    work_schedule: Optional[str] = None


class UserUpdate(BaseModel):
    # Campos que el usuario puede modificar de su perfil
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    work_schedule: Optional[str] = None


class UserOut(BaseModel):
    # Forma del usuario que se devuelve en las respuestas del API
    id: int
    first_name: str
    last_name: str
    dni: str
    email: EmailStr
    phone: Optional[str]
    role: UserRole
    specialty: Optional[str]
    work_schedule: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
