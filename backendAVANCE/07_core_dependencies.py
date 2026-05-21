# Dependencias reutilizables de FastAPI
# Aqui se obtiene el usuario autenticado y se valida su rol
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.features.users.models import User, UserRole


# Esquema OAuth2 para extraer el token de la cabecera Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Obtiene el usuario autenticado a partir del token JWT."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales invalidas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_error

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_error
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Permite el acceso solo a administradores."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores")
    return current_user


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Permite el acceso a administradores y mecanicos."""
    if current_user.role not in (UserRole.ADMIN, UserRole.MECHANIC):
        raise HTTPException(status_code=403, detail="Acceso restringido al personal del taller")
    return current_user
