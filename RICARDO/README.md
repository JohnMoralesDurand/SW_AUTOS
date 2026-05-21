# AutoServ - Sistema de Gestion de Taller Mecanico

Sistema web para la administracion integral de un taller mecanico (SGTM).
Permite la gestion de clientes, vehiculos, servicios, citas, ordenes de
trabajo, reportes y mas.

## Estructura del proyecto

```
RICARDO/
├── backend/        # API REST en Python con FastAPI + SQLAlchemy
└── frontend/       # Aplicacion web en Angular 17 + Tailwind CSS
```

Cada carpeta usa una **arquitectura por features**, donde cada modulo
funcional del sistema vive en su propia carpeta independiente.

## Stack tecnologico

### Backend
- Python 3.11+
- FastAPI (framework web)
- SQLAlchemy (ORM)
- Pydantic (validacion de datos)
- JWT + bcrypt (autenticacion)
- SQLite (base de datos local para demo)

### Frontend
- Angular 17 (standalone components)
- Tailwind CSS (estilos)
- Zod (validacion de esquemas)
- Lucide Angular (iconos modernos)

## Instalacion del backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env

# Crear base de datos con datos iniciales
python seed.py

# Ejecutar el servidor de desarrollo
python run.py
```

El API estara disponible en: `http://localhost:8000`
Documentacion automatica en: `http://localhost:8000/docs`

## Instalacion del frontend

```bash
cd frontend
npm install
npm start
```

La aplicacion estara disponible en: `http://localhost:4200`

## Usuarios de prueba

Despues de ejecutar `python seed.py` se crean tres usuarios:

| Rol           | Correo                       | Contrasena    |
|---------------|------------------------------|---------------|
| Administrador | admin@autoserv.com           | admin123      |
| Mecanico      | mecanico@autoserv.com        | mecanico123   |
| Cliente       | cliente@autoserv.com         | cliente123    |

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

## Visualizacion y reportes

El sistema usa **Chart.js** (via `ng2-charts`) para mostrar datos en forma
visual y ayudar al administrador a tomar decisiones. Tres vistas usan graficos:

- **Dashboard**: tarjetas resumen + grafico de linea con citas de los
  ultimos 7 dias + grafico de dona con el estado de citas + grafico de
  barras con los 5 servicios mas solicitados.
- **Reportes**: pantalla dedicada (solo admin) con filtro por rango de
  fechas y graficos de citas por dia, distribucion de servicios e
  ingresos generados (RF-31, RF-32, RF-33).

Para acceder a Reportes hay que iniciar sesion como administrador. La opcion
aparece en el menu lateral solo para usuarios con rol `admin`.

## Reglas de negocio aplicadas

El sistema implementa las 15 reglas de negocio definidas:
- RN-01 Unicidad de DNI
- RN-02 Unicidad de placa con formato peruano
- RN-03 Validacion de horario laboral
- RN-04 No duplicidad de citas
- RN-05 Anticipacion minima de 2 horas
- RN-06 Cancelacion con anticipacion
- RN-07 Limite de 3 citas activas
- RN-08 Vehiculo asociado obligatorio
- RN-09 Estado secuencial de cita
- RN-10 Eliminacion logica
- RN-11 Precio congelado al reservar
- RN-12 Asignacion segun especialidad
- RN-13 Cierre obligatorio con diagnostico
- RN-14 Recordatorio automatico
- RN-15 Validacion de kilometraje creciente

## Notas

- El proyecto usa SQLite por simplicidad, pero el ORM permite cambiar
  facilmente a PostgreSQL o MySQL editando `DATABASE_URL` en `.env`.
- La paleta de colores principal es verde pastel (mint/sage) para una
  apariencia moderna y agradable.
- Toda la arquitectura y los nombres estan en ingles, mientras que los
  comentarios estan en espanol para fines academicos.
