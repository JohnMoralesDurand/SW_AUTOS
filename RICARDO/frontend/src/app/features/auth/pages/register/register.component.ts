// register.component.ts
// Pantalla para crear una cuenta nueva de cliente. Los mecanicos y
// admins NO se registran por aca; a esos los crea el admin desde la
// pantalla de "Usuarios". El formulario pide nombres, apellidos, DNI
// (8 digitos), correo, telefono y una contrasena de al menos 6
// caracteres. Cuando se crea bien, ademas hace login automatico asi el
// usuario entra de una.
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

  // Formulario con todas las reglas:
  //   - nombres/apellidos: minimo 2 caracteres
  //   - dni: exactamente 8 digitos
  //   - email: que tenga formato de correo
  //   - password: minimo 6 caracteres
  readonly form = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.minLength(2)]],
    last_name: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Estados de la pantalla
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  /** Devuelve true si un campo del form esta en estado invalido y el
   *  usuario ya lo toco (no quiero mostrar errores hasta que escriba). */
  fieldHasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  /** Se ejecuta al apretar "Registrarse". */
  onSubmit(): void {
    // Marca todos los campos como "tocados" para que aparezcan los errores
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Revise los campos marcados.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Primero registro al usuario
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Cuenta creada exitosamente. Iniciando sesión...');
        // Y despues hago login automatico con esas mismas credenciales
        const { email, password } = this.form.getRawValue();
        this.authService.login(email, password).subscribe({
          next: () => this.router.navigate(['/app/dashboard']),
          error: () => this.router.navigate(['/login']),  // si falla, lo mando al login normal
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
