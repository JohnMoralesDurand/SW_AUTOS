from rest_framework import serializers
from . import models

class TipoDocumentoIdentidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TipoDocumentoIdentidad
        fields = '__all__'

class AlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Alumno
        fields = '__all__'