from rest_framework import viewsets
from . import models,serializers

class TipoDocumentoIdentidadViewSet(viewsets.ModelViewSet):
    queryset = models.TipoDocumentoIdentidad.objects.all()
    serializer_class = serializers.TipoDocumentoIdentidadSerializer

class AlumnoViewSet(viewsets.ModelViewSet):
    queryset = models.Alumno.objects.all()
    serializer_class = serializers.AlumnoSerializer