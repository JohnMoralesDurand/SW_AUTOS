# Esquemas Pydantic del feature de servicios
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ServiceBase(BaseModel):
    # Campos comunes para crear y editar servicios
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = None
    category: Optional[str] = None
    duration_minutes: int = Field(60, ge=15, le=600)
    price: float = Field(..., ge=0)


class ServiceCreate(ServiceBase):
    # Datos necesarios para registrar un servicio nuevo
    pass


class ServiceUpdate(BaseModel):
    # Campos editables del servicio
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None


class ServiceOut(BaseModel):
    # Forma del servicio en las respuestas del API
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    duration_minutes: int
    price: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
