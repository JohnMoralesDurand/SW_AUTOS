// Componente de Usuarios.
// Pantalla del admin para gestionar el personal del taller:
//   - Tabla con todos los usuarios (filtrable por rol).
//   - Formulario para registrar mecanicos (con especialidad y horario).
//   - Boton para activar/desactivar usuarios (no se borran fisico).
// Toda la logica HTTP queda en el UserService; este componente solo se
// preocupa por el estado de la UI (signal con la lista, mostrar/ocultar
// formulario, errores).
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
  Pencil,
} from 'lucide-angular';

// PrimeNG: la tabla del listado, botones de accion y tag para el rol
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
  readonly editIcon = Pencil;

  readonly users = signal<User[]>([]);
  readonly roleFilter = signal<UserRole | ''>('');
  readonly showForm = signal(false);
  // Si esta seteado, el form esta en modo edicion del mecanico con ese id
  readonly editingId = signal<number | null>(null);
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
    this.editingId.set(null);
    this.errorMessage.set(null);
    // En modo creacion todos los validadores aplican
    this.form.get('dni')?.enable();
    this.form.get('email')?.enable();
    this.form.get('password')?.enable();
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

  /** Abre el form en modo edicion de un mecanico. DNI/email/password no son editables. */
  openEditMechanic(user: User): void {
    this.editingId.set(user.id);
    this.errorMessage.set(null);
    this.showForm.set(true);
    // En edicion no se piden las credenciales (no se cambian desde aca)
    this.form.get('dni')?.disable();
    this.form.get('email')?.disable();
    this.form.get('password')?.disable();
    this.form.reset({
      first_name: user.first_name,
      last_name: user.last_name,
      dni: user.dni,
      email: user.email,
      phone: user.phone ?? '',
      password: '',
      specialty: user.specialty ?? '',
      work_schedule: user.work_schedule ?? '',
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

  /** Crea o actualiza un mecanico segun el modo del form. */
  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Revise los campos marcados en rojo.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const editing = this.editingId();
    if (editing) {
      // Edicion: solo mando los campos que se permiten cambiar
      const raw = this.form.getRawValue();
      this.userService.update(editing, {
        first_name: raw.first_name,
        last_name: raw.last_name,
        phone: raw.phone,
        specialty: raw.specialty,
        work_schedule: raw.work_schedule,
      }).subscribe({
        next: () => {
          this.loading.set(false);
          this.toggleForm();
          this.loadUsers();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(extractErrorMessage(err, 'No se pudo actualizar el mecanico.'));
        },
      });
    } else {
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
}
