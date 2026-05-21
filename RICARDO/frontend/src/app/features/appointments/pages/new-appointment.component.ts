// =============================================================================
// Componente "Nueva Cita" (RF-15, RF-16, RF-17, RF-18)
// -----------------------------------------------------------------------------
// Es el flujo principal del cliente: reservar una cita para su vehículo.
//
// Pasos de la pantalla:
//   1. Seleccionar vehículo registrado (se cargan al iniciar - RN-08).
//   2. Seleccionar servicio del catálogo (solo activos - RF-13).
//   3. Elegir una fecha (no se permite fechas pasadas).
//   4. El sistema consulta los slots disponibles ese día (RF-17).
//   5. El cliente elige uno y confirma la reserva (RF-18).
//
// La pagina puede recibir un query param ?service_id=<id> que viene del
// catálogo de servicios cuando el cliente hace click en "Reservar".
//
// Reglas de negocio que aplica el backend al reservar:
//   - RN-04: no se puede reservar un slot ya ocupado.
//   - RN-05: anticipación mínima de 2 horas.
//   - RN-07: máximo 3 citas activas por cliente.
//   - RN-11: el precio del servicio se "congela" al momento de reservar.
// =============================================================================
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Car,
  Wrench,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-angular';

import { Vehicle } from '../../../core/models/vehicle.model';
import { Service } from '../../../core/models/service.model';
import { TimeSlot } from '../../../core/models/appointment.model';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ServiceCatalogService } from '../../../core/services/service-catalog.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-new-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './new-appointment.component.html',
})
export class NewAppointmentComponent implements OnInit {
  // Iconos
  readonly carIcon = Car;
  readonly wrenchIcon = Wrench;
  readonly calendarIcon = Calendar;
  readonly clockIcon = Clock;
  readonly checkIcon = CheckCircle;
  readonly alertIcon = AlertCircle;

  // Datos cargados desde el API
  readonly vehicles = signal<Vehicle[]>([]);
  readonly services = signal<Service[]>([]);
  readonly slots = signal<TimeSlot[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Formulario reactivo de reserva
  readonly form = this.fb.nonNullable.group({
    vehicle_id: [0, [Validators.required, Validators.min(1)]],
    service_id: [0, [Validators.required, Validators.min(1)]],
    date: [this.getMinDate(), Validators.required],
    selected_slot: ['', Validators.required],
    notes: [''],
  });

  constructor(
    private fb: FormBuilder,
    private vehicleService: VehicleService,
    private serviceCatalog: ServiceCatalogService,
    private appointmentService: AppointmentService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Cargamos los vehículos del cliente y el catálogo de servicios.
    this.vehicleService.listMyVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        // Si solo tiene un vehículo, lo preseleccionamos.
        if (data.length === 1) {
          this.form.patchValue({ vehicle_id: data[0].id });
        }
      },
    });

    this.serviceCatalog.list(true).subscribe({
      next: (data) => {
        this.services.set(data);
        // Si llegamos aqui con ?service_id=<id> desde el catálogo, se preselecciona.
        const preSelected = Number(this.route.snapshot.queryParamMap.get('service_id'));
        if (preSelected && data.some((s) => s.id === preSelected)) {
          this.form.patchValue({ service_id: preSelected });
          this.loadAvailability();
        }
      },
    });
  }

  /** Devuelve la fecha mínima en formato yyyy-mm-dd (hoy). */
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /** Consulta los horarios disponibles cuando el usuario elige servicio y fecha. */
  loadAvailability(): void {
    const serviceId = Number(this.form.value.service_id);
    const date = this.form.value.date;
    if (!serviceId || serviceId < 1 || !date) {
      this.slots.set([]);
      return;
    }

    this.loading.set(true);
    this.appointmentService.getAvailability(serviceId, date).subscribe({
      next: (data) => {
        this.slots.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.slots.set([]);
      },
    });
  }

  selectSlot(slot: TimeSlot): void {
    if (!slot.available) return;
    this.form.patchValue({ selected_slot: slot.start });
  }

  /** Devuelve true si el campo fue tocado y tiene algún error. */
  fieldHasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  /** Envía la reserva al backend. */
  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Complete todos los campos y seleccione un horario disponible.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const value = this.form.getRawValue();
    this.appointmentService
      .book({
        vehicle_id: Number(value.vehicle_id),
        service_id: Number(value.service_id),
        scheduled_at: value.selected_slot,
        notes: value.notes || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Cita reservada correctamente.');
          setTimeout(() => this.router.navigate(['/app/appointments']), 1200);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(extractErrorMessage(err, 'No se pudo reservar la cita.'));
        },
      });
  }
}
