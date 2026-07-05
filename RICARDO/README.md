# AutoServ - Sistema de Gestion de Taller Mecanico

Sistema web para la administracion integral de un taller mecanico.
Permite la gestion de clientes, vehiculos, servicios, citas, ordenes de
trabajo, notificaciones, reportes e historial vehicular.

## Estructura del proyecto

```
RICARDO/
├── backend_django/     # API REST en Python con Django + Django REST Framework
│   ├── autoserv/       # Configuracion del proyecto (settings, urls)
│   ├── api/            # App principal: models, serializers, views, urls
│   ├── manage.py
│   └── seed.py         # Datos iniciales (usuarios, servicios, horarios)
└── frontend/           # Aplicacion web en Angular 17 + PrimeNG + Tailwind CSS
    └── src/
        ├── app/core/       # services, models, guards, interceptor
        ├── app/features/   # una carpeta por pantalla
        ├── app/shared/     # layout comun (sidebar + header)
        ├── model/          # clases de las entidades
        └── service/        # ApiService unificado
```

## Stack tecnologico

### Backend
- Python 3.12
- Django 6 + Django REST Framework (API REST con ViewSets)
- JWT (autenticacion con token)
- django-cors-headers (conexion con el frontend)
- SQLite (base de datos local para demo)

### Frontend
- Angular 17 (standalone components)
- PrimeNG (tablas, botones, inputs, dropdowns)
- Tailwind CSS (estilos utilitarios)
- Chart.js via ng2-charts (graficos del dashboard y reportes)
- Zod (validacion de esquemas)
- Lucide Angular (iconos)

## Instalacion del backend

```bash
cd backend_django
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

# Crear las tablas de la base de datos
python manage.py migrate

# Cargar datos iniciales (usuarios, servicios, horarios)
python seed.py

# Ejecutar el servidor de desarrollo en el puerto 8001
python manage.py runserver 8001
```

El API queda disponible en: `http://localhost:8001/api`

## Instalacion del frontend

```bash
cd frontend
npm install
npm start
```

La aplicacion queda disponible en: `http://localhost:4200`

> La URL del backend esta en `src/environments/environment.ts`
> (por defecto apunta a `http://localhost:8001/api`).

## Usuarios de prueba

Despues de ejecutar `python seed.py` se crean estos usuarios:

| Rol           | Correo                       | Contrasena    |
|---------------|------------------------------|---------------|
| Administrador | admin@autoserv.com           | admin123      |
| Mecanico      | mecanico@autoserv.com        | mecanico123   |
| Cliente       | cliente@autoserv.com         | cliente123    |

(El seed tambien crea mecanicos adicionales de cada especialidad,
todos con contrasena `mecanico123`.)

## Modulos implementados

| Codigo  | Modulo                    | Estado |
|---------|---------------------------|--------|
| MOD-01  | Autenticacion y Seguridad | OK     |
| MOD-02  | Gestion de Usuarios       | OK     |
| MOD-03  | Gestion de Vehiculos      | OK     |
| MOD-04  | Gestion de Servicios      | OK     |
| MOD-05  | Gestion de Citas          | OK     |
| MOD-06  | Ordenes de Trabajo        | OK     |
| MOD-07  | Notificaciones            | OK     |
| MOD-08  | Reportes y Estadisticas   | OK     |
| MOD-09  | Historial Vehicular       | OK     |
| MOD-10  | Fotos de la Orden         | OK     |

## Flujo principal del sistema

1. El **cliente** se registra, agrega su vehiculo y reserva una cita
   eligiendo servicio, fecha y un horario disponible.
2. El **administrador** confirma la cita y le asigna un mecanico cuya
   especialidad coincida con la categoria del servicio.
3. Al iniciar la atencion se crea automaticamente la **orden de trabajo**.
4. El **mecanico** registra el diagnostico, agrega repuestos, sube fotos
   del auto (entrada y salida) como evidencia, y cierra la orden.
5. Al cerrar, la cita queda completada y el cliente recibe una
   notificacion con el total a pagar.

## Visualizacion y reportes

El sistema usa **Chart.js** (via `ng2-charts`) para mostrar datos en forma
visual:

- **Dashboard**: tarjetas resumen + grafico de linea con citas de los
  ultimos 7 dias + grafico de dona con el estado de citas + grafico de
  barras con los 5 servicios mas solicitados.
- **Reportes** (solo admin): filtro por rango de fechas y graficos de
  citas por dia, distribucion de servicios e ingresos generados.

## Reglas de negocio aplicadas

- RN-01 Unicidad de DNI (8 digitos, validado en frontend y backend)
- RN-02 Unicidad de placa con formato peruano (ABC-123)
- RN-03 Validacion de horario laboral (por bloques; soporta horario partido)
- RN-04 No duplicidad de citas (sin solapamientos)
- RN-05 Anticipacion minima de 2 horas
- RN-06 Cancelacion tardia marcada (menos de 3 horas)
- RN-07 Limite de 3 citas activas por cliente
- RN-08 Vehiculo asociado obligatorio
- RN-09 Estado secuencial de cita (pendiente → confirmada → en atencion → completada)
- RN-10 Eliminacion logica (usuarios, vehiculos y servicios se desactivan, no se borran)
- RN-11 Precio congelado al reservar
- RN-12 Asignacion de mecanico segun especialidad
- RN-13 Cierre de orden obligatorio con diagnostico + al menos un item
- RN-14 Notificaciones automaticas (al reservar y al completar)
- RN-15 Validacion de kilometraje creciente

## Notas

- El proyecto usa SQLite por simplicidad; con Django basta cambiar
  `DATABASES` en `autoserv/settings.py` para usar PostgreSQL o MySQL.
- La paleta de colores principal es verde pastel (mint) con el tema
  aura-light-green de PrimeNG.
- Los nombres de codigo estan en ingles y los comentarios en espanol
  para fines academicos.
