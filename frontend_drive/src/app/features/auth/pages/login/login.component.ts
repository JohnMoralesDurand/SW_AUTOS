// =============================================================================
// Componente de Login (RF-02 - Inicio de sesion)
// -----------------------------------------------------------------------------
// Flujo:
//   1. El usuario llena el formulario reactivo (email + password).
//   2. Al enviar, se llama a AuthService.login() que hace POST /auth/login.
//   3. El backend (FastAPI) devuelve un token JWT firmado.
//   4. AuthService guarda el token en localStorage y emite el usuario actual.
//   5. Se navega al dashboard.
//
// Validaciones del formulario:
//   - email: requerido + formato email valido.
//   - password: requerido + minimo 6 caracteres.
// =============================================================================
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Wrench, Mail, Lock, LogIn } from 'lucide-angular';

import { AuthService } from '../../../../core/services/auth.service';
import { extractErrorMessage } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  // Iconos del componente
  readonly wrenchIcon = Wrench;
  readonly mailIcon = Mail;
  readonly lockIcon = Lock;
  readonly loginIcon = LogIn;

  // Formulario reactivo del login
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  /** Envia las credenciales al backend e inicia sesion. */
  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'No se pudo iniciar sesión. Verifique sus credenciales.'),
        );
      },
    });
  }
}
