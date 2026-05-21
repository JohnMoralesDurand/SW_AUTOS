# Logica de negocio de usuarios
# Aqui se aplican las reglas RN-01 (DNI unico) y RN-10 (eliminacion logica)
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.features.users.models import User, UserRole
from app.features.users.schemas import UserCreate, MechanicCreate, UserUpdate


def _ensure_unique(db: Session, dni: str, email: str, exclude_id: Optional[int] = None) -> None:
    """Valida que el DNI y el correo no esten registrados (RN-01)."""
    query_dni = db.query(User).filter(User.dni == dni)
    query_email = db.query(User).filter(User.email == email)
    if exclude_id is not None:
        query_dni = query_dni.filter(User.id != exclude_id)
        query_email = query_email.filter(User.id != exclude_id)

    if query_dni.first():
        raise HTTPException(status_code=400, detail="El DNI ya se encuentra registrado")
    if query_email.first():
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado")


def create_client(db: Session, data: UserCreate) -> User:
    """Registra un nuevo cliente en el sistema (RF-01)."""
    _ensure_unique(db, data.dni, data.email)
    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        dni=data.dni,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=UserRole.CLIENT,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_mechanic(db: Session, data: MechanicCreate) -> User:
    """Registra un nuevo mecanico (RF-05)."""
    _ensure_unique(db, data.dni, data.email)
    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        dni=data.dni,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=UserRole.MECHANIC,
        specialty=data.specialty,
        work_schedule=data.work_schedule,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    """Actualiza los datos del perfil del usuario (RF-06).

    El DNI no se puede modificar segun los requisitos.
    """
    if data.email and data.email != user.email:
        _ensure_unique(db, user.dni, data.email, exclude_id=user.id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def list_users(
    db: Session,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    specialty: Optional[str] = None,
):
    """Lista los usuarios con filtros opcionales (RF-07)."""
    query = db.query(User)
    if role is not None:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if specialty is not None:
        query = query.filter(User.specialty == specialty)
    return query.order_by(User.created_at.desc()).all()


def toggle_user_status(db: Session, user_id: int) -> User:
    """Activa o desactiva un usuario sin eliminarlo de la base (RF-08, RN-10)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user
