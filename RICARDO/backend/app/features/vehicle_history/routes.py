# Endpoints HTTP del feature de historial vehicular
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.features.users.models import User
from app.features.vehicle_history import service


router = APIRouter(prefix="/api/vehicle-history", tags=["Historial Vehicular"])


@router.get("/{vehicle_id}")
def get_history(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve el historial completo de servicios del vehiculo (RF-35)."""
    return service.get_vehicle_history(db, vehicle_id, current_user)


@router.get("/{vehicle_id}/maintenance-suggestions")
def maintenance_suggestions(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sugiere mantenimientos preventivos basados en kilometraje y fecha (RF-36)."""
    return service.suggest_preventive_maintenance(db, vehicle_id, current_user)
