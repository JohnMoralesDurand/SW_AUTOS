# Lógica del feature de horarios del taller
from datetime import time
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.features.schedules.models import BusinessHours
from app.features.schedules.schemas import BusinessHoursUpdate


# Configuración por defecto al inicializar el sistema
DEFAULT_SCHEDULE = [
    (0, True, "08:00", "18:00"),   # Lunes
    (1, True, "08:00", "18:00"),   # Martes
    (2, True, "08:00", "18:00"),   # Miércoles
    (3, True, "08:00", "18:00"),   # Jueves
    (4, True, "08:00", "18:00"),   # Viernes
    (5, True, "08:00", "13:00"),   # Sábado
    (6, False, "00:00", "00:00"),  # Domingo (cerrado)
]


def ensure_default_schedule(db: Session) -> None:
    """Crea las filas de horario por defecto si la tabla está vacía."""
    if db.query(BusinessHours).count() == 0:
        for day, is_open, open_t, close_t in DEFAULT_SCHEDULE:
            db.add(
                BusinessHours(
                    day_of_week=day,
                    is_open=is_open,
                    open_time=open_t,
                    close_time=close_t,
                )
            )
        db.commit()


def list_schedule(db: Session) -> List[BusinessHours]:
    """Devuelve los 7 días de la semana ordenados (lunes → domingo)."""
    ensure_default_schedule(db)
    return (
        db.query(BusinessHours)
        .order_by(BusinessHours.day_of_week.asc())
        .all()
    )


def update_day(db: Session, day_of_week: int, data: BusinessHoursUpdate) -> BusinessHours:
    """Actualiza el horario de un día específico (RF-04 admin)."""
    if day_of_week < 0 or day_of_week > 6:
        raise HTTPException(status_code=400, detail="Día de la semana inválido (0-6).")

    row = (
        db.query(BusinessHours)
        .filter(BusinessHours.day_of_week == day_of_week)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Día no encontrado.")

    # Validar que open_time < close_time si está abierto
    if data.is_open:
        oh, om = (int(x) for x in data.open_time.split(":"))
        ch, cm = (int(x) for x in data.close_time.split(":"))
        if (oh, om) >= (ch, cm):
            raise HTTPException(
                status_code=400,
                detail="La hora de apertura debe ser menor que la de cierre.",
            )

    row.is_open = data.is_open
    row.open_time = data.open_time
    row.close_time = data.close_time
    db.commit()
    db.refresh(row)
    return row


def get_day_hours(db: Session, weekday: int) -> tuple[bool, time, time]:
    """Devuelve (is_open, open_time, close_time) como objetos time para uso interno."""
    ensure_default_schedule(db)
    row = (
        db.query(BusinessHours)
        .filter(BusinessHours.day_of_week == weekday)
        .first()
    )
    if not row:
        return False, time(0, 0), time(0, 0)

    oh, om = (int(x) for x in row.open_time.split(":"))
    ch, cm = (int(x) for x in row.close_time.split(":"))
    return row.is_open, time(oh, om), time(ch, cm)
