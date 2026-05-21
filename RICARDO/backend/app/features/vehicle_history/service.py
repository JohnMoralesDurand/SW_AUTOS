# Logica del feature de historial vehicular
from datetime import datetime, timedelta
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.features.appointments.models import Appointment, AppointmentStatus
from app.features.users.models import User, UserRole
from app.features.vehicles.models import Vehicle


# Reglas para sugerir mantenimiento preventivo
KM_INTERVAL = 5000   # cada 5000 km recomendar revision
DAYS_INTERVAL = 180  # o cada 6 meses


def get_vehicle_history(db: Session, vehicle_id: int, current_user: User):
    """Lista los servicios completados de un vehiculo (RF-35)."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehiculo no encontrado")

    # El cliente solo puede ver sus propios vehiculos
    if current_user.role == UserRole.CLIENT and vehicle.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.vehicle_id == vehicle_id,
            Appointment.status == AppointmentStatus.COMPLETED,
        )
        .order_by(Appointment.scheduled_at.desc())
        .all()
    )

    return {
        "vehicle": {
            "id": vehicle.id,
            "license_plate": vehicle.license_plate,
            "brand": vehicle.brand,
            "model": vehicle.model,
            "mileage": vehicle.mileage,
        },
        "history": [
            {
                "appointment_id": a.id,
                "service": a.service.name if a.service else None,
                "date": a.scheduled_at,
                "amount": a.frozen_price,
                "mechanic": (
                    f"{a.mechanic.first_name} {a.mechanic.last_name}" if a.mechanic else None
                ),
            }
            for a in appointments
        ],
    }


def suggest_preventive_maintenance(db: Session, vehicle_id: int, current_user: User):
    """Sugiere mantenimientos preventivos segun kilometraje y fecha (RF-36)."""
    history = get_vehicle_history(db, vehicle_id, current_user)
    last_service = history["history"][0] if history["history"] else None

    suggestions = []

    if last_service:
        days_since = (datetime.utcnow() - last_service["date"]).days
        if days_since >= DAYS_INTERVAL:
            suggestions.append(
                f"Han pasado {days_since} dias desde el ultimo servicio. Se recomienda una revision general."
            )

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if vehicle and vehicle.mileage >= KM_INTERVAL:
        if vehicle.mileage % KM_INTERVAL < 1000:
            suggestions.append(
                f"Su vehiculo tiene {vehicle.mileage} km. Considere un cambio de aceite y revision de filtros."
            )

    if not suggestions:
        suggestions.append("No hay mantenimientos preventivos pendientes por el momento.")

    return {"vehicle_id": vehicle_id, "suggestions": suggestions}
