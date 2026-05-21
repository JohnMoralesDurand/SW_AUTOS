# Esquemas de entrada y salida del feature de autenticacion
from pydantic import BaseModel, EmailStr

from app.features.users.schemas import UserOut


class LoginRequest(BaseModel):
    # Credenciales de inicio de sesion
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    # Respuesta del login con el token JWT y los datos del usuario
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PasswordResetRequest(BaseModel):
    # Solicitud de recuperacion de contrasena
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    # Confirmacion de cambio de contrasena con token temporal
    token: str
    new_password: str
