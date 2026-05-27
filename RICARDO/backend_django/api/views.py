# =============================================================================
# Views de DRF para AutoServ
# -----------------------------------------------------------------------------
# Implementa toda la logica del API REST. Sigue la estructura del profesor
# (ModelViewSet) pero agrega los endpoints custom con las reglas de negocio.
# =============================================================================
from datetime import datetime, time, timedelta

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth import create_access_token
from .models import (
    Appointment, AppointmentStatus, Bloque, Dia, DiaBloque,
    Notification, NotificationType, Service, ServicePhoto,
    User, UserRole, Vehicle, WorkOrder, WorkOrderItem, WorkOrderStatus,
)
from .permissions import IsAdmin, IsStaff
from .serializers import (
    AppointmentSerializer, BloqueSerializer, DiaBloqueSerializer,
    DiaSerializer, NotificationSerializer,
    ServicePhotoSerializer, ServiceSerializer, UserCreateSerializer,
    UserSerializer, VehicleSerializer, WorkOrderSerializer,
)


# =============================================================================
# Constantes de reglas de negocio
# =============================================================================
SLOT_INTERVAL_MINUTES = 30
MIN_HOURS_AHEAD = 2          # RN-05
CANCEL_GRACE_HOURS = 3       # RN-06
MAX_ACTIVE_APPOINTMENTS = 3  # RN-07


# =============================================================================
# AUTH - Endpoints publicos de login y registro
# =============================================================================
class RegisterView(APIView):
    """Registra un nuevo cliente. Publico (no requiere token)."""

    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        data['role'] = UserRole.CLIENT
        serializer = UserCreateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        if User.objects.filter(dni=data.get('dni')).exists():
            return Response({'detail': 'El DNI ya se encuentra registrado'}, status=400)
        if User.objects.filter(email=data.get('email')).exists():
            return Response({'detail': 'El correo ya se encuentra registrado'}, status=400)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)


class LoginView(APIView):
    """Inicia sesion y devuelve un token JWT. Publico."""

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')
        if not email or not password:
            return Response({'detail': 'Correo y contrasena son requeridos'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Correo o contrasena incorrectos'}, status=401)
        if not user.is_active:
            return Response({'detail': 'Usuario desactivado'}, status=401)
        if not user.check_password(password):
            return Response({'detail': 'Correo o contrasena incorrectos'}, status=401)
        return Response({
            'access_token': create_access_token(user),
            'token_type': 'bearer',
            'user': UserSerializer(user).data,
        })


# =============================================================================
# USERS
# =============================================================================
class UserViewSet(viewsets.ModelViewSet):
    """CRUD de usuarios. Filtros por rol/especialidad (RF-07)."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get('role')
        is_active = self.request.query_params.get('is_active')
        specialty = self.request.query_params.get('specialty')
        if role:
            qs = qs.filter(role=role)
        if is_active is not None:
            qs = qs.filter(is_active=(is_active.lower() == 'true'))
        if specialty:
            qs = qs.filter(specialty=specialty)
        return qs.order_by('-created_at')

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['post'], url_path='mechanics', permission_classes=[IsAdmin])
    def create_mechanic(self, request):
        """Crea un nuevo mecanico (RF-05)."""
        data = request.data.copy()
        data['role'] = UserRole.MECHANIC
        serializer = UserCreateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        if User.objects.filter(dni=data.get('dni')).exists():
            return Response({'detail': 'El DNI ya se encuentra registrado'}, status=400)
        if User.objects.filter(email=data.get('email')).exists():
            return Response({'detail': 'El correo ya se encuentra registrado'}, status=400)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)

    @action(detail=True, methods=['patch'], url_path='toggle-status', permission_classes=[IsAdmin])
    def toggle_status(self, request, pk=None):
        """Activa o desactiva un usuario (RN-10)."""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response(UserSerializer(user).data)


# =============================================================================
# VEHICLES
# =============================================================================
class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.CLIENT:
            return Vehicle.objects.filter(owner=user, is_active=True)
        return Vehicle.objects.filter(is_active=True)

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        plate = serializer.validated_data.get('license_plate')
        if Vehicle.objects.filter(license_plate=plate, is_active=True).exists():
            raise ValidationError({'detail': 'La placa ya se encuentra registrada'})
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError
        instance = self.get_object()
        new_mileage = serializer.validated_data.get('mileage', instance.mileage)
        if new_mileage < instance.mileage:
            raise ValidationError({'detail': 'El kilometraje no puede ser menor al ultimo registrado'})
        serializer.save()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Lista los vehiculos del cliente autenticado (RF-10).

        El frontend llama a GET /api/vehicles/me para obtener solo los
        vehiculos del usuario actual.
        """
        vehicles = Vehicle.objects.filter(owner=request.user, is_active=True).order_by('-created_at')
        return Response(VehicleSerializer(vehicles, many=True).data)

    def destroy(self, request, *args, **kwargs):
        """Desactiva (soft-delete) el vehiculo en vez de borrarlo (RF-12, RN-10)."""
        instance = self.get_object()
        # Permisos: solo el dueno o un admin
        if instance.owner_id != request.user.id and request.user.role != UserRole.ADMIN:
            return Response({'detail': 'No puede eliminar este vehiculo'}, status=403)
        instance.is_active = False
        instance.save()
        return Response(VehicleSerializer(instance).data)


# =============================================================================
# SERVICES
# =============================================================================
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'toggle_status'):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        only_active = self.request.query_params.get('only_active', 'true').lower() == 'true'
        qs = Service.objects.all()
        if only_active:
            qs = qs.filter(is_active=True)
        return qs.order_by('name')

    @action(detail=True, methods=['patch'], url_path='toggle-status', permission_classes=[IsAdmin])
    def toggle_status(self, request, pk=None):
        service = self.get_object()
        service.is_active = not service.is_active
        service.save()
        return Response(ServiceSerializer(service).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_services(request):
    """Catalogo publico para visitantes sin sesion."""
    services = Service.objects.filter(is_active=True).order_by('name')
    return Response(ServiceSerializer(services, many=True).data)


# =============================================================================
# APPOINTMENTS - Aqui viven la mayoria de las reglas de negocio
# =============================================================================
def _get_day_blocks(day_of_week: int):
    """Devuelve (is_open, [(open_time, close_time), ...]) para un dia.

    Soporta multiples bloques por dia (Dia -> DiaBloque -> Bloque).
    """
    try:
        dia = Dia.objects.get(day_of_week=day_of_week)
    except Dia.DoesNotExist:
        return False, []
    if not dia.is_open:
        return False, []
    bloques = []
    for db in dia.bloques.select_related('bloque').order_by('bloque__open_time'):
        b = db.bloque
        oh, om = (int(x) for x in b.open_time.split(':'))
        ch, cm = (int(x) for x in b.close_time.split(':'))
        bloques.append((time(oh, om), time(ch, cm), db))
    return True, bloques


def _get_day_hours(day_of_week: int):
    """Devuelve (is_open, open_time, close_time) usando el primer bloque del dia.

    Mantenido por compatibilidad con codigo que asume un solo horario por dia.
    """
    is_open, bloques = _get_day_blocks(day_of_week)
    if not is_open or not bloques:
        return False, time(0, 0), time(0, 0)
    return True, bloques[0][0], bloques[-1][1]


def _parse_dt(value):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if dt.tzinfo is None:
            dt = timezone.make_aware(dt)
        return dt
    except (ValueError, AttributeError):
        return None


def _validate_business_hours(scheduled_at, duration):
    """RN-03: la cita debe encajar dentro de algun bloque horario del dia."""
    weekday = scheduled_at.weekday()
    is_open, bloques = _get_day_blocks(weekday)
    if not is_open:
        return 'El taller no atiende ese dia'

    end_dt = scheduled_at + timedelta(minutes=duration)
    if end_dt.date() != scheduled_at.date():
        return 'La hora seleccionada se extiende fuera del dia'
    start_t = scheduled_at.time()
    end_t = end_dt.time()

    # Debe encajar completamente dentro de algun bloque del dia
    for open_t, close_t, _db in bloques:
        if start_t >= open_t and end_t <= close_t:
            return None
    return 'La hora seleccionada esta fuera del horario de atencion'


def _get_dia_bloque_for(scheduled_at):
    """Devuelve el DiaBloque al que pertenece la cita (o None)."""
    weekday = scheduled_at.weekday()
    is_open, bloques = _get_day_blocks(weekday)
    if not is_open:
        return None
    start_t = scheduled_at.time()
    for open_t, close_t, db in bloques:
        if start_t >= open_t and start_t < close_t:
            return db
    return None


def _validate_minimum_advance(scheduled_at):
    """RN-05."""
    if scheduled_at - timezone.now() < timedelta(hours=MIN_HOURS_AHEAD):
        return 'Debe reservar con al menos 2 horas de anticipacion'
    return None


def _validate_no_overlap(scheduled_at, duration, exclude_id=None):
    """RN-04."""
    end = scheduled_at + timedelta(minutes=duration)
    qs = Appointment.objects.filter(
        status__in=[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS]
    )
    if exclude_id is not None:
        qs = qs.exclude(id=exclude_id)
    for ap in qs:
        existing_end = ap.scheduled_at + timedelta(minutes=ap.duration_minutes)
        if scheduled_at < existing_end and ap.scheduled_at < end:
            return 'El horario seleccionado ya esta ocupado'
    return None


def _validate_active_limit(client_id):
    """RN-07."""
    count = Appointment.objects.filter(
        client_id=client_id,
        status__in=[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
    ).count()
    if count >= MAX_ACTIVE_APPOINTMENTS:
        return 'Ha alcanzado el limite de citas activas'
    return None


class AppointmentViewSet(viewsets.ModelViewSet):
    """Gestion del ciclo de vida de las citas."""

    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.all()
        if user.role == UserRole.CLIENT:
            qs = qs.filter(client=user)
        elif user.role == UserRole.MECHANIC:
            qs = qs.filter(mechanic=user)
        sf = self.request.query_params.get('status_filter') or self.request.query_params.get('status')
        if sf:
            qs = qs.filter(status=sf)
        return qs.order_by('-scheduled_at')

    def create(self, request, *args, **kwargs):
        """Reserva una nueva cita (RF-18)."""
        user = request.user
        if user.role != UserRole.CLIENT:
            return Response({'detail': 'Solo los clientes pueden reservar citas'}, status=403)

        try:
            vehicle = Vehicle.objects.get(
                id=request.data.get('vehicle_id'),
                owner=user, is_active=True,
            )
        except Vehicle.DoesNotExist:
            return Response({'detail': 'Vehiculo invalido'}, status=400)

        try:
            service = Service.objects.get(id=request.data.get('service_id'), is_active=True)
        except Service.DoesNotExist:
            return Response({'detail': 'Servicio no disponible'}, status=400)

        scheduled_at = _parse_dt(request.data.get('scheduled_at'))
        if scheduled_at is None:
            return Response({'detail': 'Fecha invalida'}, status=400)

        for validator in [
            lambda: _validate_minimum_advance(scheduled_at),
            lambda: _validate_business_hours(scheduled_at, service.duration_minutes),
            lambda: _validate_no_overlap(scheduled_at, service.duration_minutes),
            lambda: _validate_active_limit(user.id),
        ]:
            err = validator()
            if err:
                return Response({'detail': err}, status=400)

        # Determinar a que DiaBloque pertenece la cita (referencia al horario)
        dia_bloque = _get_dia_bloque_for(scheduled_at)

        appointment = Appointment.objects.create(
            client=user, vehicle=vehicle, service=service,
            scheduled_at=scheduled_at,
            duration_minutes=service.duration_minutes,
            frozen_price=service.price,  # RN-11
            notes=request.data.get('notes', None),
            dia_bloque=dia_bloque,
        )
        Notification.objects.create(
            user=user,
            type=NotificationType.APPOINTMENT_BOOKED,
            title='Tu cita fue reservada',
            message=f'Tu cita para {service.name} esta pendiente de confirmacion.',
        )
        return Response(AppointmentSerializer(appointment).data, status=201)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def confirm(self, request, pk=None):
        ap = self.get_object()
        if ap.status != AppointmentStatus.PENDING:
            return Response({'detail': 'Solo se pueden confirmar citas pendientes'}, status=400)
        ap.status = AppointmentStatus.CONFIRMED
        ap.save()
        return Response(AppointmentSerializer(ap).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        ap = self.get_object()
        user = request.user
        if user.role == UserRole.CLIENT and ap.client_id != user.id:
            return Response({'detail': 'No autorizado'}, status=403)
        if ap.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
            return Response({'detail': 'La cita ya esta cerrada'}, status=400)
        if ap.status == AppointmentStatus.IN_PROGRESS:
            return Response({'detail': 'No se puede cancelar una cita en atencion'}, status=400)
        reason = request.data.get('reason', '')
        hours_left = (ap.scheduled_at - timezone.now()).total_seconds() / 3600
        ap.status = AppointmentStatus.CANCELLED
        ap.cancellation_reason = reason
        ap.is_late_cancellation = 'true' if hours_left < CANCEL_GRACE_HOURS else 'false'
        ap.save()
        return Response(AppointmentSerializer(ap).data)

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        ap = self.get_object()
        user = request.user
        if user.role == UserRole.CLIENT and ap.client_id != user.id:
            return Response({'detail': 'No autorizado'}, status=403)
        if ap.status not in (AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED):
            return Response({'detail': 'Solo se pueden reprogramar citas activas'}, status=400)
        new_date = _parse_dt(request.data.get('scheduled_at'))
        if new_date is None:
            return Response({'detail': 'Fecha invalida'}, status=400)
        for v in [
            lambda: _validate_minimum_advance(new_date),
            lambda: _validate_business_hours(new_date, ap.duration_minutes),
            lambda: _validate_no_overlap(new_date, ap.duration_minutes, exclude_id=ap.id),
        ]:
            err = v()
            if err:
                return Response({'detail': err}, status=400)
        ap.scheduled_at = new_date
        ap.save()
        return Response(AppointmentSerializer(ap).data)

    @action(detail=True, methods=['post'], url_path='assign-mechanic', permission_classes=[IsAdmin])
    def assign_mechanic(self, request, pk=None):
        ap = self.get_object()
        if ap.status != AppointmentStatus.CONFIRMED:
            return Response({'detail': 'La cita debe estar confirmada para asignar mecanico'}, status=400)
        try:
            mech = User.objects.get(
                id=request.data.get('mechanic_id'),
                role=UserRole.MECHANIC, is_active=True,
            )
        except User.DoesNotExist:
            return Response({'detail': 'Mecanico no valido'}, status=400)
        if ap.service.category and mech.specialty:
            if ap.service.category.lower() != mech.specialty.lower():
                return Response(
                    {'detail': 'La especialidad del mecanico no coincide con el servicio'},
                    status=400,
                )
        ap.mechanic = mech
        ap.save()
        return Response(AppointmentSerializer(ap).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def start(self, request, pk=None):
        ap = self.get_object()
        if ap.status != AppointmentStatus.CONFIRMED:
            return Response({'detail': 'La cita debe estar confirmada'}, status=400)
        if ap.mechanic is None:
            return Response({'detail': 'Debe asignar un mecanico antes de iniciar la atencion'}, status=400)
        ap.status = AppointmentStatus.IN_PROGRESS
        ap.save()
        WorkOrder.objects.get_or_create(
            appointment=ap,
            defaults={'total_amount': ap.frozen_price},
        )
        return Response(AppointmentSerializer(ap).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def appointment_availability(request):
    """Slots disponibles para un servicio en una fecha (RF-17)."""
    try:
        service = Service.objects.get(id=request.query_params.get('service_id'), is_active=True)
    except (Service.DoesNotExist, ValueError, TypeError):
        return Response({'detail': 'Servicio no encontrado'}, status=404)
    target_date = _parse_dt(request.query_params.get('date'))
    if target_date is None:
        return Response({'detail': 'Fecha invalida'}, status=400)
    weekday = target_date.weekday()
    is_open, open_t, close_t = _get_day_hours(weekday)
    if not is_open:
        return Response([])
    open_dt = datetime.combine(target_date.date(), open_t, tzinfo=target_date.tzinfo)
    close_dt = datetime.combine(target_date.date(), close_t, tzinfo=target_date.tzinfo)
    day_aps = Appointment.objects.filter(
        scheduled_at__gte=open_dt,
        scheduled_at__lt=close_dt + timedelta(days=1),
        status__in=[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
    )
    slots = []
    cursor = open_dt
    while cursor + timedelta(minutes=service.duration_minutes) <= close_dt:
        end = cursor + timedelta(minutes=service.duration_minutes)
        is_free = True
        for ap in day_aps:
            ap_end = ap.scheduled_at + timedelta(minutes=ap.duration_minutes)
            if cursor < ap_end and ap.scheduled_at < end:
                is_free = False
                break
        if cursor - timezone.now() < timedelta(hours=MIN_HOURS_AHEAD):
            is_free = False
        slots.append({'start': cursor.isoformat(), 'end': end.isoformat(), 'available': is_free})
        cursor += timedelta(minutes=SLOT_INTERVAL_MINUTES)
    return Response(slots)


# =============================================================================
# WORK ORDERS
# =============================================================================
class WorkOrderViewSet(viewsets.ModelViewSet):
    """Ordenes de trabajo (mecanico solo ve las suyas)."""

    serializer_class = WorkOrderSerializer

    def get_permissions(self):
        if self.action == 'by_appointment':
            return [IsAuthenticated()]
        return [IsStaff()]

    def get_queryset(self):
        return WorkOrder.objects.all()

    def list(self, request, *args, **kwargs):
        user = request.user
        qs = WorkOrder.objects.all()
        if user.role == UserRole.MECHANIC:
            qs = qs.filter(appointment__mechanic=user)
        chronological = list(qs.order_by('created_at'))
        sequence = {wo.id: idx + 1 for idx, wo in enumerate(chronological)}
        result = sorted(chronological, key=lambda w: w.created_at, reverse=True)
        data = []
        for wo in result:
            wo.display_number = sequence[wo.id]
            data.append(WorkOrderSerializer(wo).data)
        return Response(data)

    @action(detail=True, methods=['put'], url_path='diagnosis')
    def update_diagnosis(self, request, pk=None):
        wo = self.get_object()
        wo.diagnosis = request.data.get('diagnosis', wo.diagnosis)
        wo.save()
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=['post'], url_path='items')
    def add_item(self, request, pk=None):
        wo = self.get_object()
        if wo.status == WorkOrderStatus.CLOSED:
            return Response({'detail': 'La orden ya esta cerrada'}, status=400)
        WorkOrderItem.objects.create(
            work_order=wo,
            description=request.data.get('description', ''),
            quantity=request.data.get('quantity', 1),
            unit_price=request.data.get('unit_price', 0),
        )
        items_total = sum(i.quantity * i.unit_price for i in wo.items.all())
        wo.total_amount = wo.appointment.frozen_price + items_total
        wo.save()
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """RN-13: cierre obligatorio con diagnostico + items."""
        wo = self.get_object()
        if not wo.diagnosis:
            return Response({'detail': 'Falta registrar el diagnostico'}, status=400)
        if not wo.items.exists():
            return Response({'detail': 'Debe registrar al menos un repuesto o cargo'}, status=400)
        wo.status = WorkOrderStatus.CLOSED
        wo.closed_at = timezone.now()
        wo.appointment.status = AppointmentStatus.COMPLETED
        wo.appointment.save()
        wo.save()
        ap = wo.appointment
        Notification.objects.create(
            user=ap.client,
            type=NotificationType.SERVICE_COMPLETED,
            title='Tu servicio fue completado',
            message=(
                f"El servicio '{ap.service.name}' para el vehiculo "
                f'{ap.vehicle.license_plate} ha sido finalizado. '
                f'Total: S/ {wo.total_amount:.2f}. Ya puedes recoger tu auto.'
            ),
        )
        return Response(WorkOrderSerializer(wo).data)

    @action(detail=False, methods=['get'],
            url_path='by-appointment/(?P<appointment_id>[^/.]+)',
            permission_classes=[IsAuthenticated])
    def by_appointment(self, request, appointment_id=None):
        try:
            wo = WorkOrder.objects.get(appointment_id=appointment_id)
        except WorkOrder.DoesNotExist:
            return Response({'detail': 'Orden no encontrada'}, status=404)
        user = request.user
        if user.role == UserRole.CLIENT and wo.appointment.client_id != user.id:
            return Response({'detail': 'No tiene acceso a esta orden'}, status=403)
        return Response(WorkOrderSerializer(wo).data)


# =============================================================================
# NOTIFICATIONS
# =============================================================================
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['patch'], url_path='read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)


# =============================================================================
# HORARIO DEL TALLER - Dia + Bloque + DiaBloque
# -----------------------------------------------------------------------------
# Reemplaza al antiguo BusinessHoursViewSet. La URL sigue siendo /api/schedules
# para no romper compatibilidad con el frontend.
# =============================================================================
class DiaViewSet(viewsets.ModelViewSet):
    """Horario del taller por dia (con sus bloques).

    Usa day_of_week (0-6) como identificador en la URL en vez del id de
    base de datos. Esto mantiene compatibilidad con el frontend que ya
    enviaba day_of_week (era asi en el FastAPI original).
    """

    queryset = Dia.objects.all().order_by('day_of_week')
    serializer_class = DiaSerializer
    lookup_field = 'day_of_week'

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdmin()]

    def update(self, request, *args, **kwargs):
        """Actualiza un dia y opcionalmente reemplaza sus bloques.

        Acepta:
        - is_open: bool
        - open_time, close_time: cuando el dia tiene UN solo bloque (estilo BusinessHours antiguo)
        - bloques: array opcional con multiples bloques [{open_time, close_time}, ...]
        """
        dia = self.get_object()
        is_open = request.data.get('is_open')
        if is_open is not None:
            dia.is_open = bool(is_open)
        dia.save()

        # Si se mandan bloques (array), reemplaza la asignacion del dia
        bloques_data = request.data.get('bloques')
        if bloques_data is None:
            # Compatibilidad con frontend antiguo: usa open_time/close_time como UN bloque
            ot = request.data.get('open_time')
            ct = request.data.get('close_time')
            if ot and ct:
                bloques_data = [{'open_time': ot, 'close_time': ct}]

        if bloques_data is not None:
            # Limpiar asignaciones actuales del dia
            DiaBloque.objects.filter(dia=dia).delete()
            # Crear/reutilizar bloques y asignarlos
            for b in bloques_data:
                bloque, _ = Bloque.objects.get_or_create(
                    open_time=b['open_time'],
                    close_time=b['close_time'],
                )
                DiaBloque.objects.get_or_create(dia=dia, bloque=bloque)

        dia.refresh_from_db()
        return Response(DiaSerializer(dia).data)


class BloqueViewSet(viewsets.ModelViewSet):
    """CRUD del catalogo de bloques horarios reutilizables."""

    queryset = Bloque.objects.all().order_by('open_time')
    serializer_class = BloqueSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdmin()]


class DiaBloqueViewSet(viewsets.ModelViewSet):
    """Asignacion N a N entre dias y bloques (tabla intermedia)."""

    queryset = DiaBloque.objects.all()
    serializer_class = DiaBloqueSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdmin()]


# =============================================================================
# SERVICE PHOTOS (FotosServicio)
# =============================================================================
class ServicePhotoViewSet(viewsets.ModelViewSet):
    """CRUD de fotos asociadas a una OrdenTrabajo (FotosServicio).

    El mecanico sube fotos del auto al entrar (sin daños) y al salir.
    Sirve como evidencia ante reclamos. Cliente y admin pueden verlas
    cuando la orden esta cerrada.
    """

    serializer_class = ServicePhotoSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'upload'):
            return [IsStaff()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = ServicePhoto.objects.all()
        work_order_id = self.request.query_params.get('work_order_id')
        if work_order_id:
            qs = qs.filter(work_order_id=work_order_id)
        # Compatibilidad con el cliente (solo ve fotos de sus propias ordenes)
        user = self.request.user
        if user and user.is_authenticated and user.role == UserRole.CLIENT:
            qs = qs.filter(work_order__appointment__client=user)
        return qs.order_by('-uploaded_at')

    @action(detail=False, methods=['post'], permission_classes=[IsStaff],
            parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Sube una foto y la asocia a una orden de trabajo."""
        work_order_id = request.data.get('work_order_id')
        file = request.FILES.get('file')
        tipo = request.data.get('tipo', 'general')
        descripcion = request.data.get('descripcion', '')
        if not work_order_id or not file:
            return Response(
                {'detail': 'work_order_id y file son requeridos'}, status=400,
            )
        try:
            work_order = WorkOrder.objects.get(id=work_order_id)
        except WorkOrder.DoesNotExist:
            return Response({'detail': 'Orden de trabajo no encontrada'}, status=404)

        # Si el usuario es mecanico, solo puede subir a sus propias ordenes
        if request.user.role == UserRole.MECHANIC:
            if work_order.appointment.mechanic_id != request.user.id:
                return Response(
                    {'detail': 'Solo puedes subir fotos a tus propias ordenes'},
                    status=403,
                )

        if tipo not in ('entrada', 'salida', 'general'):
            tipo = 'general'

        photo = ServicePhoto.objects.create(
            work_order=work_order, foto=file, descripcion=descripcion,
            tipo=tipo, uploaded_by=request.user,
        )
        return Response(
            ServicePhotoSerializer(photo, context={'request': request}).data,
            status=201,
        )


# =============================================================================
# REPORTS (dashboard)
# =============================================================================
@api_view(['GET'])
@permission_classes([IsAdmin])
def reports_summary(request):
    # Clientes activos = clientes distintos que han hecho al menos una cita
    # (coincide con el calculo del FastAPI original)
    total_clients = Appointment.objects.values('client_id').distinct().count()
    total_appointments = Appointment.objects.count()
    pending = Appointment.objects.filter(status=AppointmentStatus.PENDING).count()
    completed = Appointment.objects.filter(status=AppointmentStatus.COMPLETED).count()
    today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    weekly = WorkOrder.objects.filter(
        status=WorkOrderStatus.CLOSED,
        closed_at__gte=week_ago, closed_at__lte=timezone.now(),
    ).values_list('total_amount', flat=True)
    return Response({
        'total_clients': total_clients,
        'total_appointments': total_appointments,
        'pending_appointments': pending,
        'completed_appointments': completed,
        'weekly_income': sum(weekly),
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def reports_appointments(request):
    start = _parse_dt(request.query_params.get('start'))
    end = _parse_dt(request.query_params.get('end'))
    if start is None or end is None:
        return Response({'detail': 'Fechas invalidas'}, status=400)
    from django.db.models import Count
    from django.db.models.functions import TruncDate
    rows = (
        Appointment.objects
        .filter(scheduled_at__gte=start, scheduled_at__lte=end)
        .annotate(day=TruncDate('scheduled_at'))
        .values('day').annotate(total=Count('id'))
        .order_by('day')
    )
    return Response([{'day': str(r['day']), 'total': r['total']} for r in rows])


@api_view(['GET'])
@permission_classes([IsAdmin])
def reports_top_services(request):
    from django.db.models import Count
    limit = int(request.query_params.get('limit', 5))
    rows = Service.objects.annotate(total=Count('appointment')).order_by('-total')[:limit]
    return Response([{'service': s.name, 'total': s.total} for s in rows])


# =============================================================================
# VEHICLE HISTORY (Historial Vehicular - RF-35, RF-36)
# =============================================================================
KM_INTERVAL = 5000   # cada 5000 km recomendar revision
DAYS_INTERVAL = 180  # o cada 6 meses


def _build_vehicle_history(vehicle):
    """Construye el dict de historial completo de un vehiculo."""
    completed = (
        Appointment.objects
        .filter(vehicle=vehicle, status=AppointmentStatus.COMPLETED)
        .order_by('-scheduled_at')
    )
    return {
        'vehicle': {
            'id': vehicle.id,
            'license_plate': vehicle.license_plate,
            'brand': vehicle.brand,
            'model': vehicle.model,
            'mileage': vehicle.mileage,
        },
        'history': [
            {
                'appointment_id': a.id,
                'service': a.service.name if a.service else None,
                'date': a.scheduled_at.isoformat(),
                'amount': a.frozen_price,
                'mechanic': (
                    f'{a.mechanic.first_name} {a.mechanic.last_name}' if a.mechanic else None
                ),
            }
            for a in completed
        ],
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vehicle_history(request, vehicle_id):
    """Historial completo de servicios de un vehiculo (RF-35)."""
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({'detail': 'Vehiculo no encontrado'}, status=404)
    user = request.user
    if user.role == UserRole.CLIENT and vehicle.owner_id != user.id:
        return Response({'detail': 'No autorizado'}, status=403)
    return Response(_build_vehicle_history(vehicle))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vehicle_maintenance_suggestions(request, vehicle_id):
    """Sugerencias de mantenimiento preventivo (RF-36)."""
    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({'detail': 'Vehiculo no encontrado'}, status=404)
    user = request.user
    if user.role == UserRole.CLIENT and vehicle.owner_id != user.id:
        return Response({'detail': 'No autorizado'}, status=403)

    history_data = _build_vehicle_history(vehicle)
    suggestions = []

    if history_data['history']:
        last = history_data['history'][0]
        last_date = datetime.fromisoformat(last['date'].replace('Z', '+00:00'))
        if last_date.tzinfo is None:
            last_date = timezone.make_aware(last_date)
        days_since = (timezone.now() - last_date).days
        if days_since >= DAYS_INTERVAL:
            suggestions.append(
                f'Han pasado {days_since} dias desde el ultimo servicio. '
                'Se recomienda una revision general.'
            )

    if vehicle.mileage >= KM_INTERVAL and vehicle.mileage % KM_INTERVAL < 1000:
        suggestions.append(
            f'Su vehiculo tiene {vehicle.mileage} km. '
            'Considere un cambio de aceite y revision de filtros.'
        )

    if not suggestions:
        suggestions.append('No hay mantenimientos preventivos pendientes por el momento.')

    return Response({'vehicle_id': vehicle_id, 'suggestions': suggestions})


@api_view(['GET'])
@permission_classes([IsAdmin])
def reports_income(request):
    start = _parse_dt(request.query_params.get('start'))
    end = _parse_dt(request.query_params.get('end'))
    if start is None or end is None:
        return Response({'detail': 'Fechas invalidas'}, status=400)
    total = sum(WorkOrder.objects.filter(
        status=WorkOrderStatus.CLOSED,
        closed_at__gte=start, closed_at__lte=end,
    ).values_list('total_amount', flat=True))
    return Response({
        'start': start.isoformat(),
        'end': end.isoformat(),
        'total_income': total,
    })
