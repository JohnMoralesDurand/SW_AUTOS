# Endpoints HTTP del feature de vehiculos
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.features.users.models import User, UserRole
from app.features.vehicles import service
from app.features.vehicles.schemas import VehicleCreate, VehicleOut, VehicleUpdate


router = APIRouter(prefix="/api/vehicles", tags=["Vehiculos"])


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra un nuevo vehiculo del cliente autenticado (RF-09)."""
    return service.create_vehicle(db, current_user, data)


@router.get("/me", response_model=list[VehicleOut])
def list_my_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista los vehiculos del cliente autenticado (RF-10)."""
    return service.list_vehicles_of_user(db, current_user.id)


@router.get("", response_model=list[VehicleOut])
def list_all_vehicles(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Lista todos los vehiculos del taller (uso administrativo)."""
    return service.list_all_vehicles(db)


@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza datos del vehiculo (RF-11, RN-15)."""
    vehicle = service.get_vehicle(db, vehicle_id)
    if vehicle.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="No puede modificar este vehiculo")
    return service.update_vehicle(db, vehicle, data)


@router.delete("/{vehicle_id}", response_model=VehicleOut)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Desactiva (elimina logicamente) un vehiculo del cliente (RF-12)."""
    vehicle = service.get_vehicle(db, vehicle_id)
    if vehicle.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="No puede eliminar este vehiculo")
    return service.deactivate_vehicle(db, vehicle)
