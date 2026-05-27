# =============================================================================
# Serializers de Django REST Framework para AutoServ
# -----------------------------------------------------------------------------
# Cada serializer convierte instancias de modelos en JSON (y viceversa),
# y valida los datos de entrada antes de guardarlos en la base de datos.
# =============================================================================
from rest_framework import serializers

from .models import (
    Appointment, Bloque, Dia, DiaBloque, Notification, Service,
    ServicePhoto, User, Vehicle, WorkOrder, WorkOrderItem,
)


# =============================================================================
# Usuario
# =============================================================================
class UserSerializer(serializers.ModelSerializer):
    """Representacion publica del usuario (sin contrasena)."""

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'dni', 'email', 'phone',
            'role', 'specialty', 'work_schedule', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Para registrar clientes (recibe la contrasena en texto plano)."""

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'dni', 'email', 'phone',
            'password', 'role', 'specialty', 'work_schedule',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# =============================================================================
# Vehiculo
# =============================================================================
class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            'id', 'owner', 'license_plate', 'brand', 'model', 'year',
            'mileage', 'color', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at']


# =============================================================================
# Servicio
# =============================================================================
class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


# =============================================================================
# Cita
# =============================================================================
class AppointmentSerializer(serializers.ModelSerializer):
    """Cita con datos enriquecidos para el frontend."""

    # Campos calculados (read-only) para mostrar info legible
    client_name = serializers.SerializerMethodField()
    vehicle_plate = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()
    service_category = serializers.SerializerMethodField()
    mechanic_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'client', 'vehicle', 'service', 'mechanic',
            'dia_bloque',  # nuevo: referencia al bloque horario asignado
            'scheduled_at', 'duration_minutes', 'frozen_price', 'notes',
            'status', 'cancellation_reason', 'is_late_cancellation',
            'created_at',
            # Renombrar para mantener compatibilidad con frontend
            'client_name', 'vehicle_plate', 'service_name',
            'service_category', 'mechanic_name',
        ]
        read_only_fields = [
            'id', 'created_at', 'frozen_price', 'duration_minutes',
            'status', 'cancellation_reason', 'is_late_cancellation',
            'dia_bloque',
        ]

    def get_client_name(self, obj):
        return f'{obj.client.first_name} {obj.client.last_name}' if obj.client else None

    def get_vehicle_plate(self, obj):
        return obj.vehicle.license_plate if obj.vehicle else None

    def get_service_name(self, obj):
        return obj.service.name if obj.service else None

    def get_service_category(self, obj):
        return obj.service.category if obj.service else None

    def get_mechanic_name(self, obj):
        if obj.mechanic:
            return f'{obj.mechanic.first_name} {obj.mechanic.last_name}'
        return None


class AppointmentCreateSerializer(serializers.Serializer):
    """Para reservar una cita."""
    vehicle_id = serializers.IntegerField()
    service_id = serializers.IntegerField()
    scheduled_at = serializers.DateTimeField()
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)


# =============================================================================
# Orden de Trabajo
# =============================================================================
class WorkOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrderItem
        fields = ['id', 'work_order', 'description', 'quantity', 'unit_price']
        read_only_fields = ['id', 'work_order']


class WorkOrderSerializer(serializers.ModelSerializer):
    items = WorkOrderItemSerializer(many=True, read_only=True)
    mechanic_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()
    vehicle_plate = serializers.SerializerMethodField()
    display_number = serializers.IntegerField(read_only=True, required=False, default=None)

    class Meta:
        model = WorkOrder
        fields = [
            'id', 'appointment', 'diagnosis', 'total_amount', 'status',
            'closed_at', 'created_at', 'items',
            'mechanic_name', 'service_name', 'vehicle_plate', 'display_number',
        ]
        read_only_fields = ['id', 'created_at', 'closed_at', 'total_amount']

    def get_mechanic_name(self, obj):
        ap = obj.appointment
        if ap and ap.mechanic:
            return f'{ap.mechanic.first_name} {ap.mechanic.last_name}'
        return None

    def get_service_name(self, obj):
        return obj.appointment.service.name if obj.appointment and obj.appointment.service else None

    def get_vehicle_plate(self, obj):
        return obj.appointment.vehicle.license_plate if obj.appointment and obj.appointment.vehicle else None


# =============================================================================
# Notificacion
# =============================================================================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


# =============================================================================
# Horario del taller (Dia + Bloque + DiaBloque)
# =============================================================================
class BloqueSerializer(serializers.ModelSerializer):
    """Bloque horario individual (ej: 08:00-12:00)."""

    class Meta:
        model = Bloque
        fields = ['id', 'open_time', 'close_time']
        read_only_fields = ['id']


class DiaBloqueSerializer(serializers.ModelSerializer):
    """Asignacion de un bloque a un dia (tabla intermedia)."""

    open_time = serializers.CharField(source='bloque.open_time', read_only=True)
    close_time = serializers.CharField(source='bloque.close_time', read_only=True)

    class Meta:
        model = DiaBloque
        fields = ['id', 'dia', 'bloque', 'open_time', 'close_time']
        read_only_fields = ['id']


class DiaSerializer(serializers.ModelSerializer):
    """Dia de la semana con sus bloques horarios.

    El campo `bloques` muestra todos los bloques asignados a ese dia.
    Mantiene compatibilidad con el frontend antiguo exponiendo
    open_time/close_time del PRIMER bloque (cuando solo hay uno).
    """

    bloques = serializers.SerializerMethodField()
    open_time = serializers.SerializerMethodField()
    close_time = serializers.SerializerMethodField()

    class Meta:
        model = Dia
        fields = [
            'id', 'day_of_week', 'is_open',
            'bloques',                  # array de bloques (nuevo)
            'open_time', 'close_time',  # alias del primer bloque (compatibilidad)
        ]
        read_only_fields = ['id']

    def get_bloques(self, obj):
        return [
            {
                'id': db.id,
                'bloque_id': db.bloque.id,
                'open_time': db.bloque.open_time,
                'close_time': db.bloque.close_time,
            }
            for db in obj.bloques.select_related('bloque').order_by('bloque__open_time')
        ]

    def get_open_time(self, obj):
        first = obj.bloques.select_related('bloque').order_by('bloque__open_time').first()
        return first.bloque.open_time if first else None

    def get_close_time(self, obj):
        # Devuelve el cierre del ULTIMO bloque (rango total del dia)
        last = obj.bloques.select_related('bloque').order_by('-bloque__close_time').first()
        return last.bloque.close_time if last else None


# =============================================================================
# Fotos de Servicio
# =============================================================================
class ServicePhotoSerializer(serializers.ModelSerializer):
    """Foto con URL completa lista para mostrar en el frontend."""

    url_foto = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = ServicePhoto
        fields = [
            'id', 'service', 'foto', 'url_foto', 'descripcion', 'tipo',
            'uploaded_by', 'uploaded_at',
            'uploaded_by_name', 'service_name',
        ]
        read_only_fields = ['id', 'uploaded_at', 'url_foto', 'uploaded_by']
        extra_kwargs = {
            'foto': {'write_only': True},  # el cliente solo recibe url_foto
        }

    def get_url_foto(self, obj):
        request = self.context.get('request')
        if obj.foto and request:
            return request.build_absolute_uri(obj.foto.url)
        return obj.foto.url if obj.foto else None

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f'{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}'
        return None

    def get_service_name(self, obj):
        return obj.service.name if obj.service else None
