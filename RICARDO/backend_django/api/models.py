# =============================================================================
# Modelos ORM del sistema AutoServ (Django)
# -----------------------------------------------------------------------------
# Define las 9 entidades del dominio: Usuario, Vehiculo, Servicio, Cita,
# OrdenTrabajo, ItemOrdenTrabajo, Notificacion, HorarioTaller y FotosServicio.
# =============================================================================
from django.contrib.auth.hashers import check_password, make_password
from django.db import models


# =============================================================================
# Choices (enumeraciones)
# =============================================================================
class UserRole(models.TextChoices):
    CLIENT = 'client', 'Cliente'
    MECHANIC = 'mechanic', 'Mecanico'
    ADMIN = 'admin', 'Administrador'


class AppointmentStatus(models.TextChoices):
    PENDING = 'pending', 'Pendiente'
    CONFIRMED = 'confirmed', 'Confirmada'
    IN_PROGRESS = 'in_progress', 'En atencion'
    COMPLETED = 'completed', 'Completada'
    CANCELLED = 'cancelled', 'Cancelada'


class WorkOrderStatus(models.TextChoices):
    OPEN = 'open', 'Abierta'
    CLOSED = 'closed', 'Cerrada'


class NotificationType(models.TextChoices):
    APPOINTMENT_BOOKED = 'appointment_booked', 'Cita reservada'
    APPOINTMENT_REMINDER = 'appointment_reminder', 'Recordatorio de cita'
    STATUS_CHANGED = 'status_changed', 'Cambio de estado'
    SERVICE_COMPLETED = 'service_completed', 'Servicio completado'


# =============================================================================
# Entidades
# =============================================================================
class User(models.Model):
    """Usuario del sistema: cliente, mecanico o administrador."""

    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    dni = models.CharField(max_length=8, unique=True, db_index=True)
    email = models.EmailField(max_length=120, unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CLIENT)

    # Campos especificos para mecanicos
    specialty = models.CharField(max_length=80, blank=True, null=True)
    work_schedule = models.CharField(max_length=120, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    # Helpers para autenticacion
    def set_password(self, raw_password: str) -> None:
        """Hashea la contrasena con bcrypt antes de guardarla."""
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        """Compara la contrasena ingresada con el hash guardado."""
        return check_password(raw_password, self.password_hash)


class Vehicle(models.Model):
    """Vehiculo asociado a un cliente."""

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')

    license_plate = models.CharField(max_length=10, unique=True, db_index=True)
    brand = models.CharField(max_length=60)
    model = models.CharField(max_length=60)
    year = models.IntegerField()
    mileage = models.IntegerField(default=0)
    color = models.CharField(max_length=30, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vehicles'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.license_plate} - {self.brand} {self.model}'


class Service(models.Model):
    """Servicio del catalogo del taller."""

    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=60, blank=True, null=True)
    duration_minutes = models.IntegerField(default=60)
    price = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'services'
        ordering = ['name']

    def __str__(self):
        return self.name


class Appointment(models.Model):
    """Cita reservada por un cliente."""

    client = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='client_appointments',
    )
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    mechanic = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='mechanic_appointments',
    )

    scheduled_at = models.DateTimeField(db_index=True)
    duration_minutes = models.IntegerField()
    frozen_price = models.FloatField()
    notes = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PENDING,
    )
    cancellation_reason = models.CharField(max_length=255, blank=True, null=True)
    is_late_cancellation = models.CharField(max_length=5, default='false')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        ordering = ['-scheduled_at']

    def __str__(self):
        return f'Cita #{self.id} - {self.client}'


class WorkOrder(models.Model):
    """Orden de trabajo asociada a una cita en atencion."""

    appointment = models.OneToOneField(
        Appointment, on_delete=models.CASCADE, related_name='work_order',
    )
    diagnosis = models.TextField(blank=True, null=True)
    total_amount = models.FloatField(default=0.0)
    status = models.CharField(
        max_length=10, choices=WorkOrderStatus.choices, default=WorkOrderStatus.OPEN,
    )
    closed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'work_orders'
        ordering = ['-created_at']

    def __str__(self):
        return f'Orden #{self.id}'


class WorkOrderItem(models.Model):
    """Repuesto o cargo adicional dentro de una orden de trabajo."""

    work_order = models.ForeignKey(
        WorkOrder, on_delete=models.CASCADE, related_name='items',
    )
    description = models.CharField(max_length=150)
    quantity = models.IntegerField(default=1)
    unit_price = models.FloatField(default=0.0)

    class Meta:
        db_table = 'work_order_items'

    def __str__(self):
        return f'{self.description} x{self.quantity}'

    @property
    def subtotal(self) -> float:
        return self.quantity * self.unit_price


class Notification(models.Model):
    """Notificacion enviada al usuario."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications',
    )
    type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=150)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.user})'


class BusinessHours(models.Model):
    """Horario de atencion del taller por dia de la semana.

    day_of_week: 0=Lunes ... 6=Domingo.
    """

    day_of_week = models.IntegerField(unique=True, db_index=True)
    is_open = models.BooleanField(default=True)
    open_time = models.CharField(max_length=5, default='08:00')
    close_time = models.CharField(max_length=5, default='18:00')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'business_hours'
        ordering = ['day_of_week']

    def __str__(self):
        dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
        return dias[self.day_of_week] if 0 <= self.day_of_week <= 6 else f'Dia {self.day_of_week}'


class ServicePhoto(models.Model):
    """Foto asociada a un servicio del catalogo (FotosServicio del diagrama).

    Permite registrar fotos del auto al entrar/salir del taller como evidencia.
    """

    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name='photos',
    )
    # ImageField: Django maneja el upload y guarda el archivo en MEDIA_ROOT/service_photos/
    foto = models.ImageField(upload_to='service_photos/')
    descripcion = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=20, blank=True, null=True)  # entrada/salida/general
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='uploaded_photos',
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'service_photos'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'Foto #{self.id} de {self.service}'
