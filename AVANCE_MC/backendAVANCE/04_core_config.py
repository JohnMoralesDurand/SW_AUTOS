# Archivo de configuracion: carga las variables de entorno del sistema
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Configuraciones generales del proyecto
    APP_NAME: str = "AutoServ"
    ENVIRONMENT: str = "development"

    # Conexion a base de datos (por defecto SQLite local)
    DATABASE_URL: str = "sqlite:///./autoserv.db"

    # Configuracion de seguridad para JWT
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    class Config:
        env_file = ".env"


# Instancia unica de configuracion utilizada en toda la app
settings = Settings()
