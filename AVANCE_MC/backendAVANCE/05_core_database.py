# Configuracion de la base de datos con SQLAlchemy
# Define el motor, la sesion y la clase base para los modelos
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings


# Motor de la base de datos
# El argumento check_same_thread es necesario solo cuando usamos SQLite
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

# Fabrica de sesiones de la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base de la que heredan todos los modelos ORM
Base = declarative_base()


def get_db():
    """Dependencia de FastAPI que entrega una sesion de base de datos por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
