================================================================================
 AutoServ - Codigo Fuente Esencial del BACKEND
 Stack: Python 3.12 + FastAPI + SQLAlchemy + SQLite
================================================================================

Esta carpeta contiene los archivos esenciales del backend en orden cronologico
de explicacion. Los archivos estan numerados (01, 02, 03...) para que se
ordenen automaticamente en el Explorador de Windows.

Ruta original de cada archivo: backend/app/...
Aqui los nombres se aplanaron y se les agrego un prefijo numerico.


================================================================================
 ORDEN DE EXPLICACION
================================================================================

------------------------------------------------------
 BLOQUE 1 - ARRANQUE Y CONFIGURACION
------------------------------------------------------

01_run.py
  Punto de entrada del backend. Ejecutar con: python run.py
  Levanta el servidor Uvicorn en el puerto 8000 con auto-recarga.

02_main.py
  Corazon del backend. Aqui se ensambla la aplicacion:
    - Crea la instancia FastAPI
    - Importa todos los modelos (SQLAlchemy los registra)
    - Crea las tablas con Base.metadata.create_all()
    - Configura CORS para permitir peticiones del frontend en :4200
    - Registra los routers de cada feature

03_requirements.txt
  Lista de las 12 dependencias del proyecto con sus versiones exactas.
  Instalar con: pip install -r requirements.txt


------------------------------------------------------
 BLOQUE 2 - CORE (infraestructura comun)
------------------------------------------------------

04_core_config.py
  Lee el archivo .env y expone las variables de configuracion:
    - DATABASE_URL, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES.
  Centraliza la configuracion en un solo lugar.

05_core_database.py
  Define el motor SQLAlchemy y la SessionLocal.
  Contiene get_db(), funcion que abre/cierra conexiones automaticamente
  en cada peticion HTTP (patron context manager).

06_core_security.py
  Toda la seguridad del sistema:
    - hash_password() y verify_password() con bcrypt
    - create_access_token() y decode_access_token() con JWT
  Las contrasenas NUNCA se guardan en texto plano.

07_core_dependencies.py
  Los "porteros" del API:
    - get_current_user() valida el token JWT
    - require_admin() solo permite admins
    - require_staff() permite admin + mecanicos
  Se inyectan en cada endpoint para proteger rutas.


------------------------------------------------------
 BLOQUE 3 - AUTENTICACION
------------------------------------------------------

08_auth_routes.py
  Endpoints publicos:
    - POST /api/auth/register (registro de cliente)
    - POST /api/auth/login    (devuelve el token JWT)
  Es lo primero que el frontend usa antes de pedir cualquier otra cosa.


------------------------------------------------------
 BLOQUE 4 - MODELO DE USUARIOS
------------------------------------------------------

09_users_models.py
  Define la tabla "users" con el campo "role" (CLIENT/MECHANIC/ADMIN)
  y los campos especiales para mecanicos (specialty, work_schedule).
  Una sola tabla para los 3 tipos de usuario.


------------------------------------------------------
 BLOQUE 5 - FEATURE COMPLETA: CITAS (corazon del sistema)
------------------------------------------------------

10_appointments_models.py
  Tabla "appointments" con relaciones a User, Vehicle, Service.
  Define el enum AppointmentStatus (PENDING -> CONFIRMED -> IN_PROGRESS
  -> COMPLETED, mas CANCELLED).

11_appointments_schemas.py
  Esquemas Pydantic que validan los datos del API:
    - AppointmentCreate: para reservar
    - AppointmentReschedule, AppointmentCancel, AppointmentAssignMechanic
    - AppointmentOut: forma de respuesta
  Si el frontend manda algo incorrecto, Pydantic lo rechaza.

12_appointments_service.py  *** ARCHIVO MAS IMPORTANTE ***
  Aqui vive TODA la inteligencia del modulo de citas.
  Aplica las reglas de negocio:
    - _validate_business_hours()   (horario laboral)
    - _validate_minimum_advance()  (2h de anticipacion)
    - _validate_no_overlap()       (no duplicidad)
    - _validate_active_limit()     (max 3 citas activas)
    - create_appointment()         (precio congelado)
    - cancel_appointment()         (3h de gracia)
    - assign_mechanic()            (segun especialidad)
    - start_service()              (mecanico obligatorio)
  Es EL archivo que mas valor tiene mostrar al profesor.

13_appointments_routes.py
  Los endpoints HTTP del modulo de citas:
    - POST   /api/appointments
    - GET    /api/appointments
    - POST   /api/appointments/{id}/confirm
    - POST   /api/appointments/{id}/cancel
    - POST   /api/appointments/{id}/reschedule
    - POST   /api/appointments/{id}/assign-mechanic
    - POST   /api/appointments/{id}/start


------------------------------------------------------
 BLOQUE 6 - ORDENES DE TRABAJO Y NOTIFICACIONES
------------------------------------------------------

14_work_orders_service.py
  Cierra el ciclo del servicio:
    - get_or_create_for_appointment()
    - update_diagnosis(), add_item()
    - close_work_order() <- al cerrar genera notificacion al cliente
    - list_work_orders() <- filtrado por mecanico

15_notifications_service.py
  Crea, lista y marca como leidas las notificaciones.
  Es invocado desde work_orders/service.py cuando se cierra una orden.


------------------------------------------------------
 BLOQUE 7 - DATOS INICIALES
------------------------------------------------------

16_seed.py
  Script que crea los datos iniciales para hacer demos:
    - 1 administrador (admin@autoserv.com / admin123)
    - 1 mecanico       (mecanico@autoserv.com / mecanico123)
    - 1 cliente        (cliente@autoserv.com / cliente123)
    - Catalogo de servicios iniciales


================================================================================
 GUION SUGERIDO PARA EL PROFESOR (5 minutos)
================================================================================

1. "Profesor, le voy a explicar el backend de mi sistema. Esta hecho en
    Python con FastAPI."

2. Abrir 01_run.py + 02_main.py:
   "Asi arranca todo. main.py ensambla los modulos, registra routers y
    habilita CORS para que el frontend Angular pueda hablar con el API."

3. Abrir 04_core_config.py a 07_core_dependencies.py:
   "En la carpeta core/ tengo la infraestructura comun: configuracion,
    conexion a la base de datos, seguridad con bcrypt y JWT, y los
    porteros que protegen las rutas segun el rol del usuario."

4. Abrir 08_auth_routes.py:
   "El flujo empieza por aqui: el usuario hace login y recibe un token
    JWT que llevara en cada peticion posterior."

5. Abrir 10 a 13 (la feature appointments):
   "Cada modulo del sistema tiene 4 archivos: models (tabla), schemas
    (validacion), service (logica) y routes (endpoints). Aqui muestro la
    feature de citas como ejemplo: el archivo service.py es donde viven
    todas las reglas de negocio del proyecto."

6. Abrir 14_work_orders_service.py:
   "Cuando se cierra una orden de trabajo se invoca al servicio de
    notificaciones para avisar al cliente."

7. Cerrar con 16_seed.py:
   "Este script crea los datos iniciales para hacer demos."

================================================================================
