# apps.py
# Configuracion basica del app "api". Django usa esta clase para saber
# como se llama el app; se referencia desde INSTALLED_APPS en settings.py.
from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'
