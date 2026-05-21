# Esquemas Pydantic del feature de citas
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.features.appointments.models import AppointmentStatus


class AppointmentCreate(BaseModel):
    # Datos para reservar una nueva cita
    vehicle_id: int
    service_id: int
    scheduled_at: datetime
    notes: Optional[str] = None


class AppointmentReschedule(BaseModel):
    # Datos para reprogramar una cita existente
    scheduled_at: datetime


class AppointmentCancel(BaseModel):
    # Motivo de la cancelacion (RN-06)
    reason: str = Field(..., min_length=3, max_length=255)


class AppointmentAssignMechanic(BaseModel):
    # Asignacion de mecanico a una cita (RF-23)
    mechanic_id: int


class AvailabilityRequest(BaseModel):
    # Consulta de disponibilidad horaria (RF-17)
    service_id: int
    date: datetime


class TimeSlot(BaseModel):
    # Bloque horario disponible
    start: datetime
    end: datetime
    available: bool


class AppointmentOut(BaseModel):
    # Forma de la cita en las respuestas del API
    id: int
    client_id: int
    vehicle_id: int
    service_id: int
    mechanic_id: Optional[int]
    scheduled_at: datetime
    duration_minutes: int
    frozen_price: float
    notes: Optional[str]
    status: AppointmentStatus
    cancellation_reason: Optional[str]
    created_at: datetime

    # Datos enriquecidos para mostrar en la interfaz
    client_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    service_name: Optional[str] = None
    service_category: Optional[str] = None
    mechanic_name: Optional[str] = None

    class Config:
        from_attributes = True
