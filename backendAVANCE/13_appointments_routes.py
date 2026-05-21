# Endpoints HTTP del feature de citas
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_staff
from app.features.appointments import service as appointments_service
from app.features.appointments.models import AppointmentStatus
from app.features.appointments.schemas import (
    AppointmentAssignMechanic,
    AppointmentCancel,
    AppointmentCreate,
    AppointmentOut,
    AppointmentReschedule,
    TimeSlot,
)
from app.features.users.models import User, UserRole


router = APIRouter(prefix="/api/appointments", tags=["Citas"])


@router.get("/availability", response_model=list[TimeSlot])
def check_availability(
    service_id: int,
    date: datetime,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Consulta los bloques horarios disponibles para una fecha (RF-17)."""
    return appointments_service.list_available_slots(db, service_id, date)


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reserva una nueva cita (RF-18). Solo clientes pueden reservar."""
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Solo los clientes pueden reservar citas")
    appointment = appointments_service.create_appointment(db, current_user, data)
    return appointments_service._enrich(appointment)


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    status_filter: Optional[AppointmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista las citas segun el rol del usuario (RF-22)."""
    items = appointments_service.list_appointments(db, current_user, status_filter)
    return [appointments_service._enrich(a) for a in items]


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene el detalle de una cita."""
    appointment = appointments_service.get_appointment(db, appointment_id)
    if (
        current_user.role == UserRole.CLIENT
        and appointment.client_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="No autorizado")
    return appointments_service._enrich(appointment)


@router.post("/{appointment_id}/confirm", response_model=AppointmentOut)
def confirm_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """Confirma una cita pendiente (RF-19)."""
    appointment = appointments_service.confirm_appointment(db, appointment_id)
    return appointments_service._enrich(appointment)


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    data: AppointmentCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancela una cita (RF-20, RN-06)."""
    appointment = appointments_service.get_appointment(db, appointment_id)
    if (
        current_user.role == UserRole.CLIENT
        and appointment.client_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="No autorizado")
    cancelled = appointments_service.cancel_appointment(db, appointment, data.reason)
    return appointments_service._enrich(cancelled)


@router.post("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_appointment(
    appointment_id: int,
    data: AppointmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reprograma una cita existente (RF-21)."""
    appointment = appointments_service.get_appointment(db, appointment_id)
    if (
        current_user.role == UserRole.CLIENT
        and appointment.client_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="No autorizado")
    updated = appointments_service.reschedule_appointment(db, appointment, data.scheduled_at)
    return appointments_service._enrich(updated)


@router.post("/{appointment_id}/assign-mechanic", response_model=AppointmentOut)
def assign_mechanic(
    appointment_id: int,
    data: AppointmentAssignMechanic,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Asigna un mecanico a la cita confirmada (RF-23, RN-12)."""
    appointment = appointments_service.assign_mechanic(db, appointment_id, data.mechanic_id)
    return appointments_service._enrich(appointment)


@router.post("/{appointment_id}/start", response_model=AppointmentOut)
def start_service(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    """Inicia el servicio cambiando el estado a en atencion (RF-24)."""
    appointment = appointments_service.start_service(db, appointment_id)
    return appointments_service._enrich(appointment)
