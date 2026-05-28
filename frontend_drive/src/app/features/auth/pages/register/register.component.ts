// Componente de registro de nuevos clientes (RF-01)
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, UserPlus, ArrowLeft } from 'lucide-angular';

import { AuthService } from '../../../../core/services/auth.service';
import { extractErrorMessage } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  readonly userPlusIcon = UserPlus;
  readonly arrowLeftIcon = ArrowLeft;

  // Formulario reactivo de registro con todas las validaciones
  readonly form = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.minLength(2)]],
    last_name: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  fieldHasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Revise los campos marcados.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Cuenta creada exitosamente. Iniciando sesión...');
        const { email, password } = this.form.getRawValue();
        this.authService.login(email, password).subscribe({
          next: () => this.router.navigate(['/app/dashboard']),
          error: () => this.router.navigate(['/login']),
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'No se pudo crear la cuenta. Verifique sus datos.'),
        );
      },
    });
  }
}
