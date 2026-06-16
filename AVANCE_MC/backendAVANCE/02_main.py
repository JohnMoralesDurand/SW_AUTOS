# Punto de entrada principal de la aplicacion FastAPI
# Aqui se registran todos los routers de cada feature
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine

# Importar los modelos para que SQLAlchemy los registre
from app.features.users.models import User
from app.features.vehicles.models import Vehicle
from app.features.services.models import Service
from app.features.appointments.models import Appointment
from app.features.work_orders.models import WorkOrder, WorkOrderItem
from app.features.notifications.models import Notification
from app.features.schedules.models import BusinessHours

# Importar los routers de cada feature
from app.features.auth.routes import router as auth_router
from app.features.users.routes import router as users_router
from app.features.vehicles.routes import router as vehicles_router
from app.features.services.routes import router as services_router
from app.features.appointments.routes import router as appointments_router
from app.features.work_orders.routes import router as work_orders_router
from app.features.notifications.routes import router as notifications_router
from app.features.reports.routes import router as reports_router
from app.features.vehicle_history.routes import router as history_router
from app.features.schedules.routes import router as schedules_router


# Crea las tablas de la base de datos al iniciar la app
Base.metadata.create_all(bind=engine)


# Instancia principal de FastAPI
app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="API REST del Sistema de Gestion de Taller Mecanico - AutoServ",
    version="1.0.0",
)


# Configuracion de CORS para permitir peticiones desde Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Endpoint de prueba de salud del API
@app.get("/")
def root():
    """Endpoint raiz para verificar que el API esta corriendo."""
    return {"app": settings.APP_NAME, "status": "ok", "version": "1.0.0"}


# Registro de todos los routers de los features
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(vehicles_router)
app.include_router(services_router)
app.include_router(appointments_router)
app.include_router(work_orders_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(history_router)
app.include_router(schedules_router)
