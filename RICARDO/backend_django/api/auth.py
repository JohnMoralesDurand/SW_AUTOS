# =============================================================================
# Autenticacion JWT personalizada
# -----------------------------------------------------------------------------
# Usa nuestro modelo User (no el de Django auth) para autenticar peticiones.
# Compatible con DRF: la clase CustomJWTAuthentication se registra en settings.
# =============================================================================
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User


JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_HOURS = 2


def create_access_token(user: User) -> str:
    """Genera un JWT firmado con el id del usuario."""
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Valida y decodifica un JWT. Devuelve None si es invalido o expiro."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


class CustomJWTAuthentication(BaseAuthentication):
    """Clase de autenticacion DRF que usa nuestro modelo User."""

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith(f'{self.keyword} '):
            return None

        token = auth_header[len(self.keyword) + 1:]
        payload = decode_access_token(token)
        if payload is None:
            raise AuthenticationFailed('Token invalido o expirado')

        user_id = payload.get('user_id')
        if user_id is None:
            raise AuthenticationFailed('Token sin user_id')

        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            raise AuthenticationFailed('Usuario no encontrado')

        # DRF necesita que el usuario tenga is_authenticated = True
        user.is_authenticated = True
        return (user, token)

    def authenticate_header(self, request):
        return self.keyword
