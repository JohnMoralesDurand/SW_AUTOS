// Componente de gestion de Vehiculos.
// El cliente lista sus autos, registra uno nuevo (con placa formato ABC-123),
// edita los datos (color, km) y elimina (desactiva). El admin ve todos.
// La placa se autocompleta con guion al escribir asi el formato sale bien.
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  Trash2,
  Car,
  X,
  AlertCircle,
  Pencil,
} from 'lucide-angular';

// PrimeNG: tabla, botones, inputs, tag y tooltip de los botones de accion
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { VehicleService } from '../../../core/services/vehicle.service';
import { Vehicle } from '../../../core/models/vehicle.model';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule,
    TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule,
  ],
  templateUrl: './vehicles.component.html',
})
export class VehiclesComponent implements OnInit {
  // Iconos
  readonly plusIcon = Plus;
  readonly trashIcon = Trash2;
  readonly carIcon = Car;
  readonly closeIcon = X;
  readonly alertIcon = AlertCircle;
  readonly editIcon = Pencil;

  readonly vehicles = signal<Vehicle[]>([]);
  readonly showForm = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);
  readonly currentYear = new Date().getFullYear();

  // Indica el id del vehículo en edición. null = creación nueva.
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    license_plate: [
      '',
      [Validators.required, Validators.pattern(/^[A-Z0-9]{3}-\d{3}$/)],
    ],
    brand: ['', [Validators.required, Validators.minLength(2)]],
    model: ['', [Validators.required, Validators.minLength(1)]],
    year: [
      this.currentYear,
      [Validators.required, Validators.min(1950), Validators.max(this.currentYear + 1)],
    ],
    mileage: [0, [Validators.required, Validators.min(0)]],
    color: [''],
  });

  constructor(
    private fb: FormBuilder,
    private vehicleService: VehicleService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  /** Carga los vehículos del usuario o todos si es admin. */
  loadVehicles(): void {
    const request = this.authService.isAdmin()
      ? this.vehicleService.listAll()
      : this.vehicleService.listMyVehicles();
    request.subscribe({ next: (data) => this.vehicles.set(data) });
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.form.reset({
      license_plate: '',
      brand: '',
      model: '',
      year: this.currentYear,
      mileage: 0,
      color: '',
    });
    // En modo creación la placa es editable.
    this.form.get('license_plate')?.enable();
    this.showForm.set(true);
  }

  openEditForm(vehicle: Vehicle): void {
    this.editingId.set(vehicle.id);
    this.errorMessage.set(null);
    this.form.reset({
      license_plate: vehicle.license_plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      color: vehicle.color ?? '',
    });
    // La placa no se puede modificar después del registro (RN-02).
    this.form.get('license_plate')?.disable();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.form.get('license_plate')?.enable();
  }

  /**
   * Autoformateo de placa: convierte a mayúsculas, quita caracteres no válidos,
   * y agrega el guión automáticamente después de los 3 primeros caracteres.
   */
  onPlateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);

    const formatted =
      cleaned.length > 3 ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}` : cleaned;

    this.form.patchValue({ license_plate: formatted });
  }

  fieldHasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  fieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['pattern'] && field === 'license_plate')
      return 'Formato de placa inválido. Use el formato ABC-123.';
    if (ctrl.errors['minlength']) return 'Debe tener al menos los caracteres mostrados.';
    if (ctrl.errors['min']) return `El valor mínimo permitido es ${ctrl.errors['min'].min}.`;
    if (ctrl.errors['max']) return `El valor máximo permitido es ${ctrl.errors['max'].max}.`;
    return 'Valor inválido.';
  }

  /** Crea o actualiza el vehículo según el modo del formulario. */
  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.errorMessage.set('Revise los campos marcados en rojo.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const editing = this.editingId();
    const raw = this.form.getRawValue();

    if (editing) {
      // En edición no se envía la placa (no se puede modificar).
      const { license_plate, ...payload } = raw;
      this.vehicleService.update(editing, payload).subscribe({
        next: () => {
          this.loading.set(false);
          this.closeForm();
          this.loadVehicles();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            extractErrorMessage(err, 'No se pudo actualizar el vehículo.'),
          );
        },
      });
    } else {
      const data = { ...raw, license_plate: raw.license_plate.toUpperCase() };
      this.vehicleService.create(data).subscribe({
        next: () => {
          this.loading.set(false);
          this.closeForm();
          this.loadVehicles();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            extractErrorMessage(err, 'Error al registrar el vehículo.'),
          );
        },
      });
    }
  }

  /** Elimina (desactiva) un vehículo. */
  onDelete(vehicle: Vehicle): void {
    if (!confirm(`¿Está seguro de eliminar el vehículo ${vehicle.license_plate}?`)) return;
    this.vehicleService.remove(vehicle.id).subscribe({
      next: () => this.loadVehicles(),
      error: (err) => alert(extractErrorMessage(err, 'No se pudo eliminar el vehículo.')),
    });
  }
}
