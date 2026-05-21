# Endpoints HTTP del feature de servicios
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.features.services import service as service_logic
from app.features.services.schemas import ServiceCreate, ServiceOut, ServiceUpdate
from app.features.users.models import User


router = APIRouter(prefix="/api/services", tags=["Servicios"])


@router.get("", response_model=list[ServiceOut])
def list_catalog(
    only_active: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Lista el catalogo de servicios disponibles (RF-15)."""
    return service_logic.list_services(db, only_active=only_active)


@router.get("/public", response_model=list[ServiceOut])
def public_catalog(db: Session = Depends(get_db)):
    """Catalogo publico para mostrar en la pagina de bienvenida.

    No requiere autenticacion porque cualquier visitante debe poder ver
    los servicios que ofrece el taller antes de registrarse.
    """
    return service_logic.list_services(db, only_active=True)


@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Registra un nuevo servicio en el catalogo (RF-13)."""
    return service_logic.create_service(db, data)


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Actualiza la informacion de un servicio (RF-14)."""
    return service_logic.update_service(db, service_id, data)


@router.patch("/{service_id}/toggle-status", response_model=ServiceOut)
def toggle_status(
    service_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Habilita o deshabilita un servicio del catalogo (RF-16)."""
    return service_logic.toggle_service_status(db, service_id)
