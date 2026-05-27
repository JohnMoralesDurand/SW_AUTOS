from django.db import models

# Create your models here.

class TipoDocumentoIdentidad(models.Model):
        tipo = models.CharField(max_length=40)
        abreviatura = models.CharField(max_length=5) 
        
        def __str__(self):
            return self.abreviatura

class Alumno(models.Model):
    ap = models.CharField(max_length=25)
    am = models.CharField(max_length=25)
    nombre = models.CharField(max_length=50)
    tipo_documento = models.ForeignKey(TipoDocumentoIdentidad, on_delete=models.CASCADE)
    numero_documento = models.CharField(max_length=12)
    correo = models.EmailField(max_length=40)
    telefono = models.CharField(max_length=15)
    fecha_nacimiento = models.DateField()

    def __str__(self):
        return self.ap + ' ' + self.am + ' ' + self.nombre
    
