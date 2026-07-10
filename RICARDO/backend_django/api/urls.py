# urls.py del app "api"
# Aca registro todas las direcciones del API. Hay dos formas de hacerlo:
#
# 1) Con el ROUTER: le doy un ViewSet y el router crea solo las 5 rutas
#    del CRUD (listar, ver uno, crear, editar, borrar). Por ejemplo, al
#    registrar 'users' se generan GET/POST /api/users y
#    GET/PUT/PATCH/DELETE /api/users/<id> sin escribirlas a mano.
#
# 2) Con PATH: para las rutas que NO son un CRUD de una tabla, sino una
#    accion puntual (login, reportes, disponibilidad de horarios...).
#    Esas se declaran una por una mas abajo.
#
# El trailing_slash='' es para que las URLs queden sin la barra final
# (/api/users en vez de /api/users/), que es el formato que usa el
# frontend en sus llamadas.
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter(trailing_slash='')
router.register('users', views.UserViewSet, basename='users')
router.register('vehicles', views.VehicleViewSet, basename='vehicles')
router.register('services', views.ServiceViewSet, basename='services')
router.register('appointments', views.AppointmentViewSet, basename='appointments')
router.register('work-orders', views.WorkOrderViewSet, basename='work-orders')
router.register('notifications', views.NotificationViewSet, basename='notifications')
# Horario del taller: /api/schedules devuelve los dias con sus bloques
router.register('schedules', views.DiaViewSet, basename='schedules')
router.register('bloques', views.BloqueViewSet, basename='bloques')
router.register('dia-bloques', views.DiaBloqueViewSet, basename='dia-bloques')
router.register('service-photos', views.ServicePhotoViewSet, basename='service-photos')


urlpatterns = [
    # Rutas publicas: login y registro (cualquiera puede llamarlas, sin token)
    path('api/auth/login', views.LoginView.as_view(), name='login'),
    path('api/auth/login-json', views.LoginView.as_view(), name='login-json'),
    path('api/auth/register', views.RegisterView.as_view(), name='register'),
    # Catalogo de servicios para la pagina de bienvenida (sin login)
    path('api/services/public', views.public_services, name='public-services'),

    # Rutas de acciones puntuales que declaro a mano porque no son el CRUD
    # de una tabla (el router solo sirve para CRUDs completos)
    path('api/appointments/availability', views.appointment_availability, name='availability'),
    path('api/reports/summary', views.reports_summary, name='reports-summary'),
    path('api/reports/appointments', views.reports_appointments, name='reports-appointments'),
    path('api/reports/top-services', views.reports_top_services, name='reports-top'),
    path('api/reports/income', views.reports_income, name='reports-income'),

    # Historial de servicios de un vehiculo y sugerencias de mantenimiento
    path('api/vehicle-history/<int:vehicle_id>', views.vehicle_history, name='vehicle-history'),
    path('api/vehicle-history/<int:vehicle_id>/maintenance-suggestions',
         views.vehicle_maintenance_suggestions, name='vehicle-maintenance'),

    # Y al final se enchufan todas las rutas que genero el router
    path('api/', include(router.urls)),
]
