// Componente del Catalogo de Servicios.
// Admin: ve activos e inactivos, puede crear, editar y habilitar/deshabilitar.
// Cliente: solo activos + boton para reservar.
// Mecanico: solo activos (informativo).
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  Wrench,
  ToggleLeft,
  ToggleRight,
  X,
  Calendar,
  AlertCircle,
  Pencil,
} from 'lucide-angular';

// PrimeNG para tabla, botones, inputs, tag y tooltip
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { ServiceCatalogService } from '../../../core/services/service-catalog.service';
import { Service } from '../../../core/models/service.model';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, LucideAngularModule,
    TableModule, ButtonModule, InputTextModule, TagModule, TooltipModule,
  ],
  templateUrl: './services.component.html',
})
export class ServicesComponent implements OnInit {
  // Iconos
  readonly plusIcon = Plus;
  readonly wrenchIcon = Wrench;
  readonly toggleOnIcon = ToggleRight;
  readonly toggleOffIcon = ToggleLeft;
  readonly closeIcon = X;
  readonly calendarIcon = Calendar;
  readonly alertIcon = AlertCircle;
  readonly editIcon = Pencil;

  readonly services = signal<Service[]>([]);
  readonly showForm = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Indica el id del servicio que se está editando (null = creando uno nuevo).
  readonly editingId = signal<number | null>(null);

  // Formulario reutilizable para crear y editar.
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: [''],
    duration_minutes: [60, [Validators.required, Validators.min(15)]],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  constructor(
    private fb: FormBuilder,
    private serviceCatalog: ServiceCatalogService,
    private router: Router,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    // Los administradores ven todos los servicios; los demás solo activos.
    const onlyActive = !this.authService.isAdmin();
    this.serviceCatalog.list(onlyActive).subscribe({
      next: (data) => this.services.set(data),
    });
  }

  /** Abre el formulario en modo "crear nuevo". */
  openCreateForm(): void {
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.form.reset({
      name: '',
      description: '',
      category: '',
      duration_minutes: 60,
      price: 0,
    });
    this.showForm.set(true);
  }

  /** Abre el formulario en modo "editar" con los datos del servicio. */
  openEditForm(service: Service): void {
    this.editingId.set(service.id);
    this.errorMessage.set(null);
    this.form.reset({
      name: service.name,
      description: service.description ?? '',
      category: service.category ?? '',
      duration_minutes: service.duration_minutes,
      price: service.price,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
  }

  fieldHasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  fieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['minlength']) return 'Debe tener al menos 2 caracteres.';
    if (ctrl.errors['min']) return `El valor mínimo es ${ctrl.errors['min'].min}.`;
    return 'Valor inválido.';
  }

  /** Crea o actualiza el servicio según el modo del formulario. */
  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Revise los campos marcados en rojo.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const editing = this.editingId();
    const request$ = editing
      ? this.serviceCatalog.update(editing, this.form.getRawValue())
      : this.serviceCatalog.create(this.form.getRawValue());

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.closeForm();
        this.loadServices();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'No se pudo guardar el servicio.'),
        );
      },
    });
  }

  onToggleStatus(service: Service): void {
    this.serviceCatalog.toggleStatus(service.id).subscribe({
      next: () => this.loadServices(),
    });
  }

  /**
   * Lleva al cliente a la pantalla de reserva con el servicio preseleccionado.
   */
  bookService(service: Service): void {
    this.router.navigate(['/app/appointments/new'], {
      queryParams: { service_id: service.id },
    });
  }
}
