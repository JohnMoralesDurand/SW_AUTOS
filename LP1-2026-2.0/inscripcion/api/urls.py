from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

router.register('tipodocumentoidentidad', views.TipoDocumentoIdentidadViewSet)
router.register('alumno', views.AlumnoViewSet)

urlpatterns = [
    path('api/', include(router.urls))
]