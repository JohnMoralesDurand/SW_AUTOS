# =============================================================================
# URLs del app api - sigue la estructura del profesor (router + include)
# =============================================================================
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views


# Router automatico para los ViewSets.
# trailing_slash='' hace que las URLs sean /api/users (sin slash final)
# compatible con el frontend que ya esperaba ese formato del FastAPI.
router = DefaultRouter(trailing_slash='')
router.register('users', views.UserViewSet, basename='users')
router.register('vehicles', views.VehicleViewSet, basename='vehicles')
router.register('services', views.ServiceViewSet, basename='services')
router.register('appointments', views.AppointmentViewSet, basename='appointments')
router.register('work-orders', views.WorkOrderViewSet, basename='work-orders')
router.register('notifications', views.NotificationViewSet, basename='notifications')
# Horario del taller (Dia + Bloque + DiaBloque)
# /api/schedules sigue siendo el endpoint principal (Dia) para no romper el frontend
router.register('schedules', views.DiaViewSet, basename='schedules')
router.register('bloques', views.BloqueViewSet, basename='bloques')
router.register('dia-bloques', views.DiaBloqueViewSet, basename='dia-bloques')
router.register('service-photos', views.ServicePhotoViewSet, basename='service-photos')


urlpatterns = [
    # Endpoints publicos (auth + catalogo publico)
    path('api/auth/login', views.LoginView.as_view(), name='login'),
    path('api/auth/login-json', views.LoginView.as_view(), name='login-json'),
    path('api/auth/register', views.RegisterView.as_view(), name='register'),
    path('api/services/public', views.public_services, name='public-services'),

    # Endpoints custom (no encajan en el router)
    path('api/appointments/availability', views.appointment_availability, name='availability'),
    path('api/reports/summary', views.reports_summary, name='reports-summary'),
    path('api/reports/appointments', views.reports_appointments, name='reports-appointments'),
    path('api/reports/top-services', views.reports_top_services, name='reports-top'),
    path('api/reports/income', views.reports_income, name='reports-income'),

    # Historial vehicular (RF-35, RF-36)
    path('api/vehicle-history/<int:vehicle_id>', views.vehicle_history, name='vehicle-history'),
    path('api/vehicle-history/<int:vehicle_id>/maintenance-suggestions',
         views.vehicle_maintenance_suggestions, name='vehicle-maintenance'),

    # ViewSets del router
    path('api/', include(router.urls)),
]
