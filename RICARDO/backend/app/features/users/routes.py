# Endpoints HTTP del feature de usuarios
from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.features.users import service
from app.features.users.models import User, UserRole
from app.features.users.schemas import MechanicCreate, UserOut, UserUpdate


router = APIRouter(prefix="/api/users", tags=["Usuarios"])


@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Devuelve el perfil del usuario autenticado."""
    return current_user


@router.put("/me", response_model=UserOut)
def update_my_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permite al usuario actualizar sus propios datos (RF-06)."""
    return service.update_user(db, current_user, data)


@router.get("", response_model=list[UserOut])
def list_users(
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    specialty: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Lista todos los usuarios del sistema (RF-07).

    Soporta filtros por rol, estado activo y especialidad. La especialidad
    permite que el front muestre solo mecánicos compatibles con un servicio.
    """
    return service.list_users(db, role=role, is_active=is_active, specialty=specialty)


@router.post("/mechanics", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_mechanic(
    data: MechanicCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Registra un nuevo mecanico (RF-05)."""
    return service.create_mechanic(db, data)


@router.patch("/{user_id}/toggle-status", response_model=UserOut)
def toggle_status(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Activa o desactiva la cuenta de un usuario (RF-08)."""
    return service.toggle_user_status(db, user_id)
