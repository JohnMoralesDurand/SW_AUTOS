# =============================================================================
# URLs principales del proyecto AutoServ (Django)
# =============================================================================
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def root(request):
    """Endpoint raiz: indica que el API esta corriendo."""
    return JsonResponse({'app': 'AutoServ', 'status': 'ok', 'version': '1.0.0'})


urlpatterns = [
    path('', root),
    path('admin/', admin.site.urls),
    path('', include('api.urls')),
]


# Servir archivos subidos (MEDIA) en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
