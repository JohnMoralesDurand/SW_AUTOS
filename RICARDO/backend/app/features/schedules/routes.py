# Endpoints HTTP del feature de horarios
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.features.schedules import service as schedule_logic
from app.features.schedules.schemas import BusinessHoursOut, BusinessHoursUpdate
from app.features.users.models import User


router = APIRouter(prefix="/api/schedules", tags=["Horarios"])


@router.get("", response_model=list[BusinessHoursOut])
def list_schedule(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Lista los horarios de atención de los 7 días.

    Endpoint disponible para cualquier usuario autenticado para que el
    frontend pueda calcular fechas válidas en el flujo de reserva.
    """
    return schedule_logic.list_schedule(db)


@router.put("/{day_of_week}", response_model=BusinessHoursOut)
def update_day(
    day_of_week: int,
    data: BusinessHoursUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Actualiza el horario de un día. Solo admin."""
    return schedule_logic.update_day(db, day_of_week, data)
