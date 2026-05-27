# =============================================================================
# Permisos personalizados de DRF para AutoServ
# -----------------------------------------------------------------------------
# Validan el rol del usuario autenticado:
#   - IsAdmin    -> solo administradores
#   - IsStaff    -> administradores y mecanicos
#   - IsClient   -> solo clientes
# =============================================================================
from rest_framework.permissions import BasePermission

from .models import User, UserRole


def _get_user_obj(request):
    """Obtiene el objeto User del modelo a partir del usuario JWT."""
    # SimpleJWT inyecta el usuario autenticado en request.user, pero usa el
    # User de auth.models. Necesitamos buscar nuestro User propio por id.
    if not request.user or not request.user.is_authenticated:
        return None
    try:
        return User.objects.get(id=request.user.id)
    except User.DoesNotExist:
        return None


class IsAdmin(BasePermission):
    """Permite el acceso solo a administradores."""

    message = 'Acceso restringido a administradores.'

    def has_permission(self, request, view):
        user = _get_user_obj(request)
        return user is not None and user.role == UserRole.ADMIN


class IsStaff(BasePermission):
    """Permite el acceso a admin + mecanicos."""

    message = 'Acceso restringido al personal del taller.'

    def has_permission(self, request, view):
        user = _get_user_obj(request)
        return user is not None and user.role in (UserRole.ADMIN, UserRole.MECHANIC)


class IsClient(BasePermission):
    """Permite el acceso solo a clientes."""

    message = 'Acceso restringido a clientes.'

    def has_permission(self, request, view):
        user = _get_user_obj(request)
        return user is not None and user.role == UserRole.CLIENT
