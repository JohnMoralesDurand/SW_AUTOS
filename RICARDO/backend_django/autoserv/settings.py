"""
Settings de Django para el proyecto AutoServ.
Backend del Sistema de Gestion de Taller Mecanico.

La estructura sigue el ejemplo del profe (proyecto "inscripcion"): tenemos un
solo app "api" donde van models/serializers/views/urls, mas la config de
DRF + JWT + CORS para que se conecte con el frontend Angular.
"""
from datetime import timedelta
from pathlib import Path

# BASE_DIR apunta a la carpeta del manage.py (igual al ejemplo del profe)
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Seguridad
# ---------------------------------------------------------------------------
SECRET_KEY = 'django-insecure-autoserv-change-this-in-production-key'
DEBUG = True
ALLOWED_HOSTS = ['*']


# ---------------------------------------------------------------------------
# Apps instaladas
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    # Mi app principal (ahi van models, views, serializers, urls)
    'api',
    # DRF para los ViewSets que vimos en clase
    'rest_framework',
    # JWT para el login (como el ejemplo de LP1 con TokenObtainPair)
    'rest_framework_simplejwt',
    # CORS para que Angular en :4200 pueda llamar al backend en :8000
    'corsheaders',
    # Apps por defecto de Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


ROOT_URLCONF = 'autoserv.urls'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


WSGI_APPLICATION = 'autoserv.wsgi.application'


# ---------------------------------------------------------------------------
# Base de datos (SQLite por simplicidad - igual que el proyecto del profesor)
# ---------------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]


LANGUAGE_CODE = 'es-pe'
TIME_ZONE = 'America/Lima'
USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------------------------
# Archivos estaticos y de medios (uploads del usuario)
# ---------------------------------------------------------------------------
STATIC_URL = 'static/'
MEDIA_URL = '/uploads/'
MEDIA_ROOT = BASE_DIR / 'uploads'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# El frontend Angular usa URLs sin slash final (estilo FastAPI).
# Esto evita las redirecciones automaticas a /api/x/ y conserva compatibilidad.
APPEND_SLASH = False


# ---------------------------------------------------------------------------
# Django REST Framework + JWT
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'api.auth.CustomJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}


# JWT: tokens validos por 2 horas (igual que el FastAPI original)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# CORS para conectar con el frontend.
# Sin esto el navegador bloquea las llamadas desde Angular (localhost:4200)
# al backend Django (localhost:8001). Es la misma config que tiene el profe
# en el settings.py del ejemplo de DESARROLLO_WEB_2.0.
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
]
CORS_ALLOW_CREDENTIALS = True
