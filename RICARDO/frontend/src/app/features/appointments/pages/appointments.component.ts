// Componente standalone de la pantalla "Citas".
// Es el listado principal con filtros por estado. En ngOnInit() llamo al
// AppointmentService para traer las citas y las guardo en un signal asi
// el template se re-renderiza solo cuando cambia la lista. Los botones de
// accion (confirmar, cancelar, asignar mecanico, iniciar) llaman al
// service y al terminar refrescan la tabla con load().
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  CheckCircle,
  XCircle,
  Play,
  CalendarDays,
  CalendarClock,
  UserCog,
  X,
  Eye,
} from 'lucide-angular';

// PrimeNG: TableModule para la tabla del listado, ButtonModule para los
// botones de accion y TagModule para mostrar el estado de la cita con
// colores. ConfirmDialog y Toast para confirmar acciones importantes y
// avisar el resultado con un mensajito flotante.
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { WorkOrder, WorkOrderService } from '../../../core/services/work-order.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

interface StatusOption {
  value: AppointmentStatus | '';
  label: string;
  chipClass: string;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, LucideAngularModule,
    // Modulos PrimeNG: tabla, botones, tag, dialogo de confirmacion y toast
    TableModule, ButtonModule, TagModule, ConfirmDialogModule, ToastModule,
  ],
  templateUrl: './appointments.component.html',
  providers: [ConfirmationService, MessageService],
})
export class AppointmentsComponent implements OnInit {
  // Iconos
  readonly plusIcon = Plus;
  readonly confirmIcon = CheckCircle;
  readonly cancelIcon = XCircle;
  readonly startIcon = Play;
  readonly calendarIcon = CalendarDays;
  readonly rescheduleIcon = CalendarClock;
  readonly assignIcon = UserCog;
  readonly closeIcon = X;
  readonly viewIcon = Eye;

  readonly appointments = signal<Appointment[]>([]);
  readonly statusFilter = signal<AppointmentStatus | ''>('');

  // Modal de reagendar / asignar mecánico.
  readonly showRescheduleModal = signal(false);
  readonly showAssignModal = signal(false);
  readonly modalAppointment = signal<Appointment | null>(null);
  readonly newDate = signal<string>('');
  readonly mechanics = signal<User[]>([]);
  readonly selectedMechanic = signal<number>(0);
  readonly modalLoading = signal(false);
  readonly modalError = signal<string | null>(null);

  // Modal "Ver detalle" para citas completadas
  readonly showDetailModal = signal(false);
  readonly detailWorkOrder = signal<WorkOrder | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  // Cada filtro tiene su color semántico (mismo color que el badge del estado).
  readonly statusOptions: StatusOption[] = [
    { value: '', label: 'Todos', chipClass: 'chip-neutral' },
    { value: 'pending', label: 'Pendientes', chipClass: 'chip-warning' },
    { value: 'confirmed', label: 'Confirmadas', chipClass: 'chip-info' },
    { value: 'in_progress', label: 'En atención', chipClass: 'chip-progress' },
    { value: 'completed', label: 'Completadas', chipClass: 'chip-success' },
    { value: 'cancelled', label: 'Canceladas', chipClass: 'chip-danger' },
  ];

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    private workOrderService: WorkOrderService,
    public authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  // ngOnInit se ejecuta cuando Angular crea el componente. Aca aprovecho
  // para hacer la primera carga de la lista de citas.
  ngOnInit(): void {
    this.loadAppointments();
  }

  // Trae las citas del backend pasando el filtro por estado si hay alguno.
  // Uso la forma con { next: ... } por si en el futuro quiero agregar un
  // { error: ... } para mostrar mensajes de error.
  loadAppointments(): void {
    const status = this.statusFilter() || undefined;
    this.appointmentService.list(status as AppointmentStatus | undefined).subscribe({
      next: (data) => this.appointments.set(data),
    });
  }

  onFilterChange(value: string): void {
    this.statusFilter.set(value as AppointmentStatus | '');
    this.loadAppointments();
  }

  /** El admin confirma una cita pendiente (con toast de resultado). */
  onConfirm(appointment: Appointment): void {
    this.appointmentService.confirm(appointment.id).subscribe({
      next: () => {
        this.loadAppointments();
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmación',
          detail: 'La cita se ha confirmado correctamente',
        });
      },
      error: (err) => this.showError(extractErrorMessage(err, 'Error al confirmar la cita.')),
    });
  }

  onCancel(appointment: Appointment): void {
    const reason = prompt('Indique el motivo de la cancelación:');
    if (!reason || reason.trim().length < 3) return;
    this.appointmentService.cancel(appointment.id, reason).subscribe({
      next: () => {
        this.loadAppointments();
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmación',
          detail: 'La cita se ha cancelado',
        });
      },
      error: (err) => this.showError(extractErrorMessage(err, 'Error al cancelar la cita.')),
    });
  }

  /** Inicia la atencion de la cita. Pide confirmacion antes porque este
   *  paso crea la orden de trabajo y ya no se puede deshacer. */
  onStart(appointment: Appointment): void {
    this.confirmationService.confirm({
      message: '¿Iniciar la atención de esta cita? Se creará la orden de trabajo para el mecánico.',
      header: 'Confirmar inicio de atención',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Iniciar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.appointmentService.start(appointment.id).subscribe({
          next: () => {
            this.loadAppointments();
            this.messageService.add({
              severity: 'info',
              summary: 'Confirmación',
              detail: 'La atención ha iniciado y se creó la orden de trabajo',
            });
          },
          error: (err) => this.showError(extractErrorMessage(err, 'Error al iniciar la atención.')),
        });
      },
    });
  }

  /** Muestra un toast rojo con el mensaje de error (reemplaza al alert()). */
  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  // Reagendar
  openRescheduleModal(appointment: Appointment): void {
    this.modalAppointment.set(appointment);
    // Inicializa el datetime-local con la fecha actual de la cita.
    const current = new Date(appointment.scheduled_at);
    this.newDate.set(this.toDatetimeLocal(current));
    this.modalError.set(null);
    this.showRescheduleModal.set(true);
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal.set(false);
    this.modalAppointment.set(null);
    this.modalError.set(null);
  }

  confirmReschedule(): void {
    const appointment = this.modalAppointment();
    if (!appointment || !this.newDate()) return;

    this.modalLoading.set(true);
    this.modalError.set(null);

    // Convertimos el datetime-local a ISO con timezone.
    const iso = new Date(this.newDate()).toISOString();
    this.appointmentService.reschedule(appointment.id, iso).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.closeRescheduleModal();
        this.loadAppointments();
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmación',
          detail: 'La cita se ha reagendado correctamente',
        });
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.modalError.set(
          extractErrorMessage(err, 'No se pudo reagendar la cita.'),
        );
      },
    });
  }

  // Asignar mecánico
  openAssignModal(appointment: Appointment): void {
    this.modalAppointment.set(appointment);
    // Preselecciono el mecanico que ya tiene asignado (si tiene). El
    // backend manda este campo como "mechanic"; antes se leia mechanic_id
    // (no existia) y el dropdown nunca preseleccionaba nada.
    this.selectedMechanic.set(appointment.mechanic ?? 0);
    this.modalError.set(null);
    this.mechanics.set([]);
    // Cargamos sólo los mecánicos cuya especialidad coincide con la categoría
    // del servicio (RN-12). Si la cita no trae categoría, mostramos todos.
    const category = appointment.service_category ?? undefined;
    this.userService.list('mechanic', true, category).subscribe({
      next: (data) => this.mechanics.set(data),
    });
    this.showAssignModal.set(true);
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
    this.modalAppointment.set(null);
    this.modalError.set(null);
  }

  confirmAssignMechanic(): void {
    const appointment = this.modalAppointment();
    const mechanicId = Number(this.selectedMechanic());
    if (!appointment || !mechanicId) {
      this.modalError.set('Seleccione un mecánico.');
      return;
    }

    this.modalLoading.set(true);
    this.appointmentService.assignMechanic(appointment.id, mechanicId).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.closeAssignModal();
        this.loadAppointments();
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmación',
          detail: 'El mecánico se ha asignado correctamente',
        });
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.modalError.set(
          extractErrorMessage(err, 'No se pudo asignar el mecánico.'),
        );
      },
    });
  }

  // Ver detalle de la orden de trabajo (cita completada)
  openDetailModal(appointment: Appointment): void {
    this.modalAppointment.set(appointment);
    this.detailWorkOrder.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);
    this.showDetailModal.set(true);

    this.workOrderService.getByAppointment(appointment.id).subscribe({
      next: (data) => {
        this.detailWorkOrder.set(data);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailLoading.set(false);
        this.detailError.set(
          extractErrorMessage(err, 'No se pudo cargar el detalle de la orden.'),
        );
      },
    });
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.modalAppointment.set(null);
    this.detailWorkOrder.set(null);
    this.detailError.set(null);
  }

  /** Indica si la fila debe mostrar al menos un botón de acción para el rol/estado actual. */
  hasActions(appointment: Appointment): boolean {
    const isStaff = !this.authService.isClient();
    const isAdmin = this.authService.isAdmin();
    const status = appointment.status;
    if (status === 'pending' && isStaff) return true;
    if (status === 'confirmed' && isAdmin) return true;
    if (status === 'confirmed' && isStaff) return true;
    if (status === 'pending' || status === 'confirmed') return true; // reagendar/cancelar
    if (status === 'completed') return true; // ver detalle
    return false;
  }

  // Funciones ayudantes para pintar los estados en la tabla

  /** Convierte un Date a "YYYY-MM-DDTHH:MM" para input[type=datetime-local]. */
  private toDatetimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  /** Estilos del badge según el estado. */
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return map[status] ?? 'badge-muted';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      in_progress: 'En atención',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return map[status] ?? status;
  }
}
