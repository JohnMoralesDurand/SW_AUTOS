# Logica de autenticacion: login y recuperacion de contrasena
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.features.users.models import User


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Verifica las credenciales del usuario y retorna el modelo (RF-02)."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contrasena incorrectos")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="La cuenta se encuentra desactivada")
    return user


def generate_token_for(user: User) -> str:
    """Genera un token JWT con el id y el rol del usuario."""
    return create_access_token({"sub": str(user.id), "role": user.role.value})


def request_password_reset(db: Session, email: str) -> str:
    """Genera un token temporal de recuperacion de contrasena (RF-03).

    En un caso real este token se enviaria por correo. Aqui lo retornamos
    para fines de demostracion en clase.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # No revelamos si el correo existe o no por seguridad
        return ""
    token = create_access_token({"sub": str(user.id), "purpose": "reset"}, expires_minutes=30)
    return token


def confirm_password_reset(db: Session, token: str, new_password: str) -> None:
    """Cambia la contrasena del usuario usando el token de recuperacion."""
    payload = decode_access_token(token)
    if not payload or payload.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Token invalido o expirado")

    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.password_hash = hash_password(new_password)
    db.commit()
