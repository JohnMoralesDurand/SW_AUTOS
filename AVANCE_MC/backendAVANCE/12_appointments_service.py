# Logica de negocio del feature de citas
# Implementa las reglas RN-03 a RN-09 y RN-11
from datetime import datetime, time, timedelta
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.features.appointments.models import Appointment, AppointmentStatus
from app.features.appointments.schemas import (
    AppointmentCreate,
    AppointmentOut,
    TimeSlot,
)
from app.features.schedules import service as schedule_service
from app.features.services.models import Service
from app.features.users.models import User, UserRole
from app.features.vehicles.models import Vehicle


# Configuración general (RN-03 horario, RN-05/06/07 reglas de cita)
SLOT_INTERVAL_MINUTES = 30
MIN_HOURS_AHEAD = 2  # RN-05
CANCEL_GRACE_HOURS = 3  # RN-06
MAX_ACTIVE_APPOINTMENTS = 3  # RN-07


def _validate_business_hours(db: Session, scheduled_at: datetime, duration: int) -> None:
    """Valida que la cita esté dentro del horario de atención (RN-03).

    Lee la configuración desde la tabla business_hours para que el admin
    pueda modificar los horarios sin tocar el código.
    """
    weekday = scheduled_at.weekday()  # Lunes = 0, Domingo = 6
    is_open, open_time, close_time = schedule_service.get_day_hours(db, weekday)

    if not is_open:
        raise HTTPException(
            status_code=400,
            detail="El taller no atiende ese día.",
        )

    start_t = scheduled_at.time()
    end_dt = scheduled_at + timedelta(minutes=duration)
    end_t = end_dt.time()

    if start_t < open_time or end_t > close_time or end_dt.date() != scheduled_at.date():
        raise HTTPException(
            status_code=400,
            detail="La hora seleccionada está fuera del horario de atención.",
        )


def _validate_minimum_advance(scheduled_at: datetime) -> None:
    """Valida que la reserva se haga con al menos 2 horas de anticipacion (RN-05)."""
    now = datetime.utcnow()
    if scheduled_at - now < timedelta(hours=MIN_HOURS_AHEAD):
        raise HTTPException(
            status_code=400,
            detail="Debe reservar con al menos 2 horas de anticipacion",
        )


def _validate_no_overlap(
    db: Session, scheduled_at: datetime, duration: int, exclude_id: Optional[int] = None
) -> None:
    """Valida que no exista otra cita activa que se cruce con el horario (RN-04)."""
    end = scheduled_at + timedelta(minutes=duration)

    query = db.query(Appointment).filter(
        Appointment.status.in_(
            [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS]
        )
    )
    if exclude_id is not None:
        query = query.filter(Appointment.id != exclude_id)

    candidates = query.all()
    for appointment in candidates:
        existing_end = appointment.scheduled_at + timedelta(minutes=appointment.duration_minutes)
        # Cruce si los rangos se intersectan
        if scheduled_at < existing_end and appointment.scheduled_at < end:
            raise HTTPException(
                status_code=400,
                detail="El horario seleccionado ya esta ocupado",
            )


def _validate_active_limit(db: Session, client_id: int) -> None:
    """Valida que el cliente no tenga mas de 3 citas activas (RN-07)."""
    active_count = (
        db.query(Appointment)
        .filter(
            Appointment.client_id == client_id,
            Appointment.status.in_(
                [
                    AppointmentStatus.PENDING,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.IN_PROGRESS,
                ]
            ),
        )
        .count()
    )
    if active_count >= MAX_ACTIVE_APPOINTMENTS:
        raise HTTPException(
            status_code=400,
            detail="Ha alcanzado el limite de citas activas",
        )


def _enrich(appointment: Appointment) -> AppointmentOut:
    """Convierte el modelo en un esquema enriquecido con datos relacionados."""
    return AppointmentOut(
        id=appointment.id,
        client_id=appointment.client_id,
        vehicle_id=appointment.vehicle_id,
        service_id=appointment.service_id,
        mechanic_id=appointment.mechanic_id,
        scheduled_at=appointment.scheduled_at,
        duration_minutes=appointment.duration_minutes,
        frozen_price=appointment.frozen_price,
        notes=appointment.notes,
        status=appointment.status,
        cancellation_reason=appointment.cancellation_reason,
        created_at=appointment.created_at,
        client_name=f"{appointment.client.first_name} {appointment.client.last_name}" if appointment.client else None,
        vehicle_plate=appointment.vehicle.license_plate if appointment.vehicle else None,
        service_name=appointment.service.name if appointment.service else None,
        service_category=appointment.service.category if appointment.service else None,
        mechanic_name=(
            f"{appointment.mechanic.first_name} {appointment.mechanic.last_name}"
            if appointment.mechanic
            else None
        ),
    )


def list_available_slots(db: Session, service_id: int, date: datetime) -> List[TimeSlot]:
    """Calcula los bloques horarios disponibles para un servicio (RF-17)."""
    service = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()  # noqa: E712
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    weekday = date.weekday()
    is_open, open_time, close_time = schedule_service.get_day_hours(db, weekday)
    if not is_open:
        return []

    open_dt = datetime.combine(date.date(), open_time)
    close_dt = datetime.combine(date.date(), close_time)

    # Trae las citas activas del dia
    day_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.scheduled_at >= open_dt,
            Appointment.scheduled_at < close_dt + timedelta(days=1),
            Appointment.status.in_(
                [
                    AppointmentStatus.PENDING,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.IN_PROGRESS,
                ]
            ),
        )
        .all()
    )

    slots: List[TimeSlot] = []
    cursor = open_dt
    while cursor + timedelta(minutes=service.duration_minutes) <= close_dt:
        end = cursor + timedelta(minutes=service.duration_minutes)
        # Verifica si choca con alguna cita
        is_free = True
        for ap in day_appointments:
            ap_end = ap.scheduled_at + timedelta(minutes=ap.duration_minutes)
            if cursor < ap_end and ap.scheduled_at < end:
                is_free = False
                break

        # Verifica que respete la anticipacion minima
        if cursor - datetime.utcnow() < timedelta(hours=MIN_HOURS_AHEAD):
            is_free = False

        slots.append(TimeSlot(start=cursor, end=end, available=is_free))
        cursor += timedelta(minutes=SLOT_INTERVAL_MINUTES)

    return slots


def create_appointment(db: Session, client: User, data: AppointmentCreate) -> Appointment:
    """Reserva una nueva cita aplicando todas las reglas de negocio (RF-18)."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle or vehicle.owner_id != client.id or not vehicle.is_active:
        raise HTTPException(status_code=400, detail="Vehiculo invalido")

    service = db.query(Service).filter(Service.id == data.service_id, Service.is_active == True).first()  # noqa: E712
    if not service:
        raise HTTPException(status_code=400, detail="Servicio no disponible")

    _validate_minimum_advance(data.scheduled_at)
    _validate_business_hours(db, data.scheduled_at, service.duration_minutes)
    _validate_no_overlap(db, data.scheduled_at, service.duration_minutes)
    _validate_active_limit(db, client.id)

    appointment = Appointment(
        client_id=client.id,
        vehicle_id=vehicle.id,
        service_id=service.id,
        scheduled_at=data.scheduled_at,
        duration_minutes=service.duration_minutes,
        # Aplica RN-11: precio congelado al momento de la reserva
        frozen_price=service.price,
        notes=data.notes,
        status=AppointmentStatus.PENDING,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def list_appointments(
    db: Session,
    user: User,
    status_filter: Optional[AppointmentStatus] = None,
) -> List[Appointment]:
    """Lista las citas filtrando segun el rol del usuario (RF-22)."""
    query = db.query(Appointment)

    if user.role == UserRole.CLIENT:
        query = query.filter(Appointment.client_id == user.id)
    elif user.role == UserRole.MECHANIC:
        query = query.filter(Appointment.mechanic_id == user.id)

    if status_filter is not None:
        query = query.filter(Appointment.status == status_filter)

    return query.order_by(Appointment.scheduled_at.desc()).all()


def get_appointment(db: Session, appointment_id: int) -> Appointment:
    """Obtiene una cita por id."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return appointment


def confirm_appointment(db: Session, appointment_id: int) -> Appointment:
    """Cambia el estado de la cita a confirmada (RF-19, RN-09)."""
    appointment = get_appointment(db, appointment_id)
    if appointment.status != AppointmentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Solo se pueden confirmar citas pendientes")
    appointment.status = AppointmentStatus.CONFIRMED
    db.commit()
    db.refresh(appointment)
    return appointment


def cancel_appointment(db: Session, appointment: Appointment, reason: str) -> Appointment:
    """Cancela la cita aplicando la regla RN-06."""
    if appointment.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
        raise HTTPException(status_code=400, detail="La cita ya esta cerrada")
    if appointment.status == AppointmentStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="No se puede cancelar una cita en atencion")

    hours_left = (appointment.scheduled_at - datetime.utcnow()).total_seconds() / 3600
    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancellation_reason = reason
    appointment.is_late_cancellation = "true" if hours_left < CANCEL_GRACE_HOURS else "false"
    db.commit()
    db.refresh(appointment)
    return appointment


def reschedule_appointment(db: Session, appointment: Appointment, new_date: datetime) -> Appointment:
    """Reprograma una cita existente validando la nueva disponibilidad (RF-21)."""
    if appointment.status not in (AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED):
        raise HTTPException(status_code=400, detail="Solo se pueden reprogramar citas activas")

    _validate_minimum_advance(new_date)
    _validate_business_hours(db, new_date, appointment.duration_minutes)
    _validate_no_overlap(db, new_date, appointment.duration_minutes, exclude_id=appointment.id)

    appointment.scheduled_at = new_date
    db.commit()
    db.refresh(appointment)
    return appointment


def assign_mechanic(db: Session, appointment_id: int, mechanic_id: int) -> Appointment:
    """Asigna un mecanico a la cita confirmada (RF-23, RN-12)."""
    appointment = get_appointment(db, appointment_id)
    if appointment.status != AppointmentStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="La cita debe estar confirmada para asignar mecanico")

    mechanic = db.query(User).filter(User.id == mechanic_id, User.role == UserRole.MECHANIC).first()
    if not mechanic or not mechanic.is_active:
        raise HTTPException(status_code=400, detail="Mecanico no valido")

    # RN-12: la especialidad del mecanico debe coincidir con la categoria del servicio
    if appointment.service.category and mechanic.specialty:
        if appointment.service.category.lower() != mechanic.specialty.lower():
            raise HTTPException(
                status_code=400,
                detail="La especialidad del mecanico no coincide con el servicio",
            )

    appointment.mechanic_id = mechanic.id
    db.commit()
    db.refresh(appointment)
    return appointment


def start_service(db: Session, appointment_id: int) -> Appointment:
    """Cambia el estado a en atención y genera la orden de trabajo (RF-24)."""
    appointment = get_appointment(db, appointment_id)
    if appointment.status != AppointmentStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="La cita debe estar confirmada.")

    # Para que toda cita completada quede con mecánico responsable identificado
    if appointment.mechanic_id is None:
        raise HTTPException(
            status_code=400,
            detail="Debe asignar un mecánico antes de iniciar la atención.",
        )

    appointment.status = AppointmentStatus.IN_PROGRESS
    db.commit()
    db.refresh(appointment)

    # Genera automáticamente la orden de trabajo asociada (RF-24).
    # Importamos aquí para evitar ciclos de imports en módulo.
    from app.features.work_orders import service as work_order_service
    work_order_service.get_or_create_for_appointment(db, appointment.id)

    return appointment
