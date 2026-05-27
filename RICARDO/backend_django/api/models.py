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

    # Vinculo al bloque horario del taller (FK opcional). Permite saber
    # exactamente en que bloque del dia se atendera la cita.
    dia_bloque = models.ForeignKey(
        'DiaBloque', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='appointments',
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


class Dia(models.Model):
    """Dia de la semana del horario del taller.

    Reemplaza al antiguo BusinessHours dividiendolo en 3 modelos:
    Dia (configuracion del dia) + Bloque (horarios reutilizables) +
    DiaBloque (intermedia: que bloques estan asignados a cada dia).

    Esto permite que un dia tenga MULTIPLES bloques (ej: 8-12 manana + 14-18 tarde).

    day_of_week: 0=Lunes ... 6=Domingo
    """

    day_of_week = models.IntegerField(unique=True, db_index=True)
    is_open = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dia'
        ordering = ['day_of_week']

    def __str__(self):
        dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
        return dias[self.day_of_week] if 0 <= self.day_of_week <= 6 else f'Dia {self.day_of_week}'


class Bloque(models.Model):
    """Bloque horario reutilizable (ej: 08:00-12:00, 14:00-18:00).

    Un mismo bloque puede ser usado en varios dias (relacion N a N via DiaBloque).
    """

    open_time = models.CharField(max_length=5)   # "HH:MM"
    close_time = models.CharField(max_length=5)  # "HH:MM"

    class Meta:
        db_table = 'bloque'
        ordering = ['open_time']

    def __str__(self):
        return f'{self.open_time} - {self.close_time}'


class DiaBloque(models.Model):
    """Tabla intermedia: un dia tiene 0..* bloques horarios.

    Permite que el lunes tenga horario partido (8-12 y 14-18) por ejemplo.
    """

    dia = models.ForeignKey(Dia, on_delete=models.CASCADE, related_name='bloques')
    bloque = models.ForeignKey(Bloque, on_delete=models.CASCADE, related_name='dias')

    class Meta:
        db_table = 'dia_bloque'
        unique_together = ('dia', 'bloque')
        ordering = ['dia__day_of_week', 'bloque__open_time']

    def __str__(self):
        return f'{self.dia} -> {self.bloque}'


class ServicePhoto(models.Model):
    """Foto vinculada a una OrdenTrabajo (FotosServicio del diagrama).

    Permite registrar evidencia fotografica del auto al ENTRAR al taller
    (estado inicial sin daños) y al SALIR (estado final sin daños).
    Sirve como respaldo ante reclamos de "el auto vino con rasguños".

    El mecanico sube las fotos durante su orden de trabajo; el admin y el
    cliente pueden visualizarlas cuando la orden se cierra.
    """

    work_order = models.ForeignKey(
        WorkOrder, on_delete=models.CASCADE, related_name='photos',
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
        return f'Foto #{self.id} de orden #{self.work_order_id}'
