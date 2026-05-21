# Logica de negocio del feature de vehiculos
# Aplica las reglas RN-02 (placa unica) y RN-15 (kilometraje creciente)
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.features.users.models import User
from app.features.vehicles.models import Vehicle
from app.features.vehicles.schemas import VehicleCreate, VehicleUpdate


def create_vehicle(db: Session, owner: User, data: VehicleCreate) -> Vehicle:
    """Registra un vehiculo asociandolo al cliente actual (RF-09, RN-02)."""
    existing = db.query(Vehicle).filter(
        Vehicle.license_plate == data.license_plate,
        Vehicle.is_active == True,  # noqa: E712
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="La placa ya se encuentra registrada en el sistema")

    vehicle = Vehicle(
        owner_id=owner.id,
        license_plate=data.license_plate,
        brand=data.brand,
        model=data.model,
        year=data.year,
        mileage=data.mileage,
        color=data.color,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def list_vehicles_of_user(db: Session, owner_id: int) -> List[Vehicle]:
    """Lista los vehiculos activos de un usuario (RF-10)."""
    return (
        db.query(Vehicle)
        .filter(Vehicle.owner_id == owner_id, Vehicle.is_active == True)  # noqa: E712
        .order_by(Vehicle.created_at.desc())
        .all()
    )


def list_all_vehicles(db: Session, only_active: bool = True) -> List[Vehicle]:
    """Lista todos los vehiculos del sistema (uso administrativo)."""
    query = db.query(Vehicle)
    if only_active:
        query = query.filter(Vehicle.is_active == True)  # noqa: E712
    return query.order_by(Vehicle.created_at.desc()).all()


def get_vehicle(db: Session, vehicle_id: int) -> Vehicle:
    """Obtiene un vehiculo por su id o lanza 404."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehiculo no encontrado")
    return vehicle


def update_vehicle(db: Session, vehicle: Vehicle, data: VehicleUpdate) -> Vehicle:
    """Actualiza los datos de un vehiculo aplicando RN-15."""
    payload = data.model_dump(exclude_unset=True)

    if "mileage" in payload and payload["mileage"] < vehicle.mileage:
        raise HTTPException(
            status_code=400,
            detail="El kilometraje no puede ser menor al ultimo registrado",
        )

    for field, value in payload.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


def deactivate_vehicle(db: Session, vehicle: Vehicle) -> Vehicle:
    """Desactiva el vehiculo (RF-12, RN-10).

    Tambien valida que no tenga citas pendientes para no eliminarlo.
    """
    # Importacion local para evitar ciclos entre modulos
    from app.features.appointments.models import Appointment, AppointmentStatus

    pending = (
        db.query(Appointment)
        .filter(
            Appointment.vehicle_id == vehicle.id,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        )
        .first()
    )
    if pending:
        raise HTTPException(status_code=400, detail="El vehiculo tiene citas pendientes")

    vehicle.is_active = False
    db.commit()
    db.refresh(vehicle)
    return vehicle
