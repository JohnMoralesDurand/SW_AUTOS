# Logica del feature de catalogo de servicios
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.features.services.models import Service
from app.features.services.schemas import ServiceCreate, ServiceUpdate


def create_service(db: Session, data: ServiceCreate) -> Service:
    """Registra un nuevo servicio en el catalogo (RF-13)."""
    service = Service(**data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def update_service(db: Session, service_id: int, data: ServiceUpdate) -> Service:
    """Actualiza un servicio existente (RF-14)."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service


def list_services(db: Session, only_active: bool = True) -> List[Service]:
    """Lista los servicios del catalogo (RF-15)."""
    query = db.query(Service)
    if only_active:
        query = query.filter(Service.is_active == True)  # noqa: E712
    return query.order_by(Service.name).all()


def get_service(db: Session, service_id: int) -> Service:
    """Obtiene un servicio por su id."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return service


def toggle_service_status(db: Session, service_id: int) -> Service:
    """Activa o desactiva un servicio sin eliminarlo (RF-16, RN-10)."""
    service = get_service(db, service_id)
    service.is_active = not service.is_active
    db.commit()
    db.refresh(service)
    return service
