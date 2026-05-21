# Endpoints HTTP del feature de autenticacion (MOD-01)
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.auth import service as auth_service
from app.features.auth.schemas import (
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    TokenResponse,
)
from app.features.users import service as users_service
from app.features.users.schemas import UserCreate, UserOut


router = APIRouter(prefix="/api/auth", tags=["Autenticacion"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_client(data: UserCreate, db: Session = Depends(get_db)):
    """Permite a un nuevo cliente registrarse en el sistema (RF-01)."""
    return users_service.create_client(db, data)


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Inicia sesion con correo y contrasena (RF-02).

    Se utiliza OAuth2PasswordRequestForm para que sea compatible con la
    documentacion automatica de FastAPI (Swagger UI).
    """
    user = auth_service.authenticate_user(db, form.username, form.password)
    token = auth_service.generate_token_for(user)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login-json", response_model=TokenResponse)
def login_json(data: LoginRequest, db: Session = Depends(get_db)):
    """Variante de login que recibe un JSON (lo usa el frontend Angular)."""
    user = auth_service.authenticate_user(db, data.email, data.password)
    token = auth_service.generate_token_for(user)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/password-reset/request")
def password_reset_request(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Genera un token temporal de recuperacion de contrasena (RF-03)."""
    token = auth_service.request_password_reset(db, data.email)
    # En produccion el token se enviaria por correo, no en la respuesta
    return {"message": "Si el correo existe, se ha enviado un enlace de recuperacion", "demo_token": token}


@router.post("/password-reset/confirm")
def password_reset_confirm(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Confirma el cambio de contrasena utilizando el token temporal."""
    auth_service.confirm_password_reset(db, data.token, data.new_password)
    return {"message": "Contrasena actualizada correctamente"}


@router.post("/logout")
def logout():
    """Cierra la sesion del usuario (RF-04).

    Como usamos JWT stateless, la invalidacion real ocurre en el cliente
    eliminando el token. Este endpoint existe por consistencia.
    """
    return {"message": "Sesion cerrada"}
