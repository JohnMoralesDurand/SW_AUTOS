# permissions.py
# Los "permisos" son porteros que corren ANTES de cada peticion y deciden
# si el usuario puede usar ese endpoint segun su rol:
#   - IsAdmin  -> solo el administrador
#   - IsStaff  -> el personal del taller (administrador y mecanicos)
#   - IsClient -> solo clientes
# Si el permiso devuelve False, DRF corta ahi mismo y responde 403
# (prohibido) sin llegar a ejecutar la vista.
from rest_framework.permissions import BasePermission

from .models import User, UserRole


def _get_user_obj(request):
    """Busca en la tabla users al usuario que hizo la peticion.

    El token trae el id del usuario; con ese id traigo el registro
    completo para poder revisar su rol. Si no hay sesion devuelve None.
    """
    if not request.user or not request.user.is_authenticated:
        return None
    try:
        return User.objects.get(id=request.user.id)
    except User.DoesNotExist:
        return None


class IsAdmin(BasePermission):
    """Deja pasar solo a los administradores."""

    # Este es el mensaje que le llega al frontend cuando se le niega el paso
    message = 'Acceso restringido a administradores.'

    def has_permission(self, request, view):
        user = _get_user_obj(request)
        return user is not None and user.role == UserRole.ADMIN


class IsStaff(BasePermission):
    """Deja pasar al personal del taller: administrador y mecanicos."""

    message = 'Acceso restringido al personal del taller.'

    def has_permission(self, request, view):
        user = _get_user_obj(request)
        return user is not None and user.role in (UserRole.ADMIN, UserRole.MECHANIC)


class IsClient(BasePermission):
    """Deja pasar solo a los clientes."""

    message = 'Acceso restringido a clientes.'

    def has_permission(self, request, view):
        user = _get_user_obj(request)
        return user is not None and user.role == UserRole.CLIENT
