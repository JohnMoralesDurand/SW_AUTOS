// Componente de Usuarios.
// Es el CRUD mas parecido al ejemplo de Alumno del profe: una tabla con los
// usuarios + un formulario para crear mecanicos + boton para activar/
// desactivar. La logica esta toda en el UserService que llama al backend
// Django, igual que el ApiService del profe.
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  X,
  AlertCircle,
} from 'lucide-angular';

// PrimeNG (aplicado siguiendo el ejemplo del profesor)
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { UserService } from '../../../core/services/user.service';
import { ServiceCatalogService } from '../../../core/services/service-catalog.service';
import { User, UserRole } from '../../../core/models/user.model';
import { extractErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, LucideAngularModule,
    // Modulos PrimeNG (referencia: profesor en DESARROLLO_WEB_2.0)
    TableModule, ButtonModule, TagModule,
  ],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  // Iconos
  readonly userPlusIcon = UserPlus;
  readonly toggleOnIcon = ToggleRight;
  readonly toggleOffIcon = ToggleLeft;
  readonly closeIcon = X;
  readonly alertIcon = AlertCircle;

  readonly users = signal<User[]>([]);
  readonly roleFilter = signal<UserRole | ''>('');
  readonly showForm = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Categorías disponibles (derivadas del catálogo de servicios) para el dropdown de Especialidad.
  readonly specialties = signal<string[]>([]);

  // Formulario para registrar un mecánico.
  readonly form = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.minLength(2)]],
    last_name: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^\d{6,15}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    specialty: ['', [Validators.required]],
    work_schedule: [''],
  });

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private serviceCatalog: ServiceCatalogService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadSpecialties();
  }

  /** Carga las categorías únicas del catálogo de servicios para el dropdown. */
  private loadSpecialties(): void {
    this.serviceCatalog.list(true).subscribe({
      next: (services) => {
        const unique = Array.from(
          new Set(services.map((s) => s.category).filter((c): c is string => !!c)),
        ).sort((a, b) => a.localeCompare(b));
        this.specialties.set(unique);
      },
    });
  }

  loadUsers(): void {
    const role = this.roleFilter() || undefined;
    this.userService.list(role as UserRole | undefined).subscribe({
      next: (data) => this.users.set(data),
    });
  }

  onFilter(role: string): void {
    this.roleFilter.set(role as UserRole | '');
    this.loadUsers();
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    this.errorMessage.set(null);
    this.form.reset({
      first_name: '',
      last_name: '',
      dni: '',
      email: '',
      phone: '',
      password: '',
      specialty: '',
      work_schedule: '',
    });
  }

  fieldHasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  fieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['email']) return 'Correo electrónico inválido.';
    if (ctrl.errors['minlength']) {
      const min = ctrl.errors['minlength'].requiredLength;
      return `Mínimo ${min} caracteres.`;
    }
    if (ctrl.errors['pattern'] && field === 'dni') return 'El DNI debe tener exactamente 8 dígitos.';
    if (ctrl.errors['pattern'] && field === 'phone') return 'Solo dígitos (entre 6 y 15).';
    return 'Valor inválido.';
  }

  /** Crea un nuevo mecánico (RF-05). */
  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Revise los campos marcados en rojo.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userService.createMechanic(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.toggleForm();
        this.loadUsers();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(extractErrorMessage(err, 'Error al crear el mecánico.'));
      },
    });
  }

  onToggleStatus(user: User): void {
    if (!confirm(`¿Cambiar estado de ${user.first_name} ${user.last_name}?`)) return;
    this.userService.toggleStatus(user.id).subscribe({
      next: () => this.loadUsers(),
    });
  }

  /** Etiqueta legible para los roles. */
  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      client: 'Cliente',
      mechanic: 'Mecánico',
      admin: 'Administrador',
    };
    return map[role] ?? role;
  }

  /** Estilos del badge segun el rol. */
  getRoleClass(role: string): string {
    const map: Record<string, string> = {
      client: 'badge-info',
      mechanic: 'badge-success',
      admin: 'badge-warning',
    };
    return map[role] ?? 'badge-muted';
  }
}
