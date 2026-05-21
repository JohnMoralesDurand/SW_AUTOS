================================================================================
 AutoServ - Codigo Fuente Esencial del FRONTEND
 Stack: TypeScript + Angular 17 + Tailwind CSS + Chart.js
================================================================================

Esta carpeta contiene los archivos esenciales del frontend en orden cronologico
de explicacion. Los archivos estan numerados (01, 02, 03...) para que se
ordenen automaticamente en el Explorador de Windows.

Ruta original de cada archivo: frontend/src/...
Aqui los nombres se aplanaron y se les agrego un prefijo numerico.

NOTA: El frontend usa TypeScript (.ts) porque los navegadores web no ejecutan
Python. TypeScript es JavaScript con tipos, compatible con Angular.

COMENTARIOS EN EL CODIGO:
Cada archivo tiene un bloque de comentarios al inicio que explica:
  - Que hace el archivo
  - Como encaja con los demas
  - Que conceptos de Angular se usan
  - Que reglas de negocio (RF/RN) implementa, si aplica
Los comentarios estan escritos en espanol para que sean faciles de leer al
presentar el codigo al profesor.


================================================================================
 ORDEN DE EXPLICACION
================================================================================

------------------------------------------------------
 BLOQUE 1 - ARRANQUE Y CONFIGURACION
------------------------------------------------------

01_main.ts
  Primera linea de codigo que se ejecuta al cargar la pagina.
  Arranca la aplicacion Angular cargando el componente raiz.
  Tiene solo 3-4 lineas.

02_app.config.ts
  Configuracion global de la aplicacion. Aqui se registran:
    - provideRouter()                       (sistema de rutas)
    - provideHttpClient()                   (cliente HTTP)
    - withInterceptors([authInterceptor])   (token JWT automatico)
    - provideCharts(withDefaultRegisterables()) (Chart.js)

03_app.routes.ts
  Mapa de URLs de la aplicacion. Cada ruta tiene un path, un componente
  y opcionalmente un guard que protege el acceso.
  Ejemplo: /login -> LoginComponent, /app/dashboard -> DashboardComponent

04_environment.ts
  Variable apiUrl que apunta al backend (http://localhost:8000/api).
  Cambiando este archivo se puede apuntar a otro servidor.


------------------------------------------------------
 BLOQUE 2 - INFRAESTRUCTURA COMUN (carpeta core/)
------------------------------------------------------

05_user.model.ts
  Interfaz TypeScript que describe como luce un usuario en el frontend.
  Es un "contrato de datos" con el backend. Cualquier cambio aqui se
  refleja en todos los componentes que consumen User.

06_auth.service.ts
  Servicio Angular que habla con el endpoint /api/auth del backend.
  Tiene los metodos login(), register(), logout() y guarda el token
  JWT en localStorage. Mantiene el estado del usuario actual con
  signals (currentUser, isAdmin, isClient, etc).

07_auth.interceptor.ts
  Interceptor HTTP que agrega automaticamente el header
  "Authorization: Bearer <token>" a cada peticion saliente.
  Asi cada request al backend ya viene autenticado sin tener que
  escribir el token a mano en cada llamada.

08_auth.guard.ts
  Guard que bloquea las rutas privadas si no hay sesion activa.
  Redirige al login si el usuario no esta autenticado.


------------------------------------------------------
 BLOQUE 3 - LOGIN (primera pantalla que ve el usuario)
------------------------------------------------------

09_login.component.ts
  Logica del formulario de login. Usa FormBuilder de Angular para
  validaciones reactivas (email, password requeridos). Al enviar
  llama a authService.login() y redirige al dashboard si exitoso.

10_login.component.html
  Plantilla HTML del formulario de login con clases Tailwind.
  Muestra mensajes de error si las credenciales son invalidas.


------------------------------------------------------
 BLOQUE 4 - LAYOUT COMUN A TODAS LAS PAGINAS
------------------------------------------------------

11_main-layout.component.ts
  Componente envolvente que se aplica a todas las paginas privadas:
    - Sidebar izquierdo con navegacion
    - Header con campanita de notificaciones
    - <router-outlet> donde se renderiza la pagina actual
  El menu lateral cambia segun el rol del usuario (admin ve mas).


------------------------------------------------------
 BLOQUE 5 - FEATURE COMPLETA: CITAS (la mas representativa)
------------------------------------------------------

12_appointment.service.ts
  Servicio Angular que consume los endpoints /api/appointments del
  backend. Tiene los metodos: list(), create(), confirm(), cancel(),
  reschedule(), assignMechanic(), start().

13_appointments.component.ts  *** EL MAS COMPLETO ***
  Logica de la pagina de gestion de citas. Aqui se ven los conceptos
  modernos de Angular 17:
    - Standalone component (sin NgModule)
    - Signals: appointments(), statusFilter(), modalAppointment()
    - 3 modales: reagendar, asignar mecanico, ver detalle
    - Inyeccion de dependencias en el constructor
    - Filtrado por rol (admin/mecanico/cliente)
    - Comunicacion con multiples servicios

14_appointments.component.html
  Plantilla con:
    - Tabla de citas con chips de filtro de estado
    - Botones de accion condicionales segun rol y estado
    - 3 modales con formularios
    - Sintaxis @if y @for de Angular 17 (control flow nuevo)


------------------------------------------------------
 BLOQUE 6 - DASHBOARD CON GRAFICOS
------------------------------------------------------

15_dashboard.component.ts
  Pagina de inicio con graficos Chart.js (via ng2-charts):
    - Grafico de linea: citas de los ultimos 7 dias
    - Grafico de dona: estado de citas
    - Grafico de barras: servicios mas solicitados
  Solo el admin ve estos graficos completos.


================================================================================
 GUION SUGERIDO PARA EL PROFESOR (5 minutos)
================================================================================

1. "Profesor, el frontend esta hecho en Angular 17 con TypeScript.
    Aclaro que TypeScript es necesario porque los navegadores no
    ejecutan Python: es el lenguaje del lado cliente."

2. Abrir 01_main.ts + 02_app.config.ts + 03_app.routes.ts:
   "Asi arranca la aplicacion: main.ts es el punto de entrada,
    app.config.ts registra los providers globales (router, HTTP,
    Chart.js), y app.routes.ts define las URLs."

3. Abrir 05 a 08 (core/):
   "En la carpeta core/ tengo la infraestructura comun: modelos
    TypeScript que describen los datos, servicios que hablan con el
    API, un interceptor que agrega el token JWT automaticamente, y
    un guard que protege las rutas privadas."

4. Abrir 09_login.component.ts y 10_login.component.html:
   "El flujo empieza aqui: el usuario inicia sesion, recibe un token
    y queda autenticado para todas las peticiones siguientes."

5. Abrir 11_main-layout.component.ts:
   "Una vez logueado, todas las paginas usan este layout comun:
    sidebar con navegacion adaptada al rol, header con la campanita
    de notificaciones."

6. Abrir 12, 13, 14 (la feature appointments):
   "Esta es la pagina mas completa: gestion de citas. Uso signals
    para el estado reactivo (concepto moderno de Angular 17), tres
    modales (reagendar, asignar mecanico, ver detalle) y la logica
    cambia segun el rol del usuario."

7. Cerrar con 15_dashboard.component.ts:
   "El dashboard muestra graficos con Chart.js que consumen los
    endpoints de reportes del backend."

================================================================================
