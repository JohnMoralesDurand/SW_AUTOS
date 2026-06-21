// login.component.ts
// Pantalla de inicio de sesion. Tiene un formulario con correo y
// contrasena, mas las validaciones (que esten llenos, que el correo
// tenga formato y la contrasena al menos 6 caracteres). Cuando el
// usuario aprieta "Ingresar":
//   1. Verifica que el form sea valido.
//   2. Llama a AuthService.login() que manda los datos al backend.
//   3. Si todo sale bien, navega al dashboard.
//   4. Si hubo error (credenciales malas), muestra el mensaje en
//      pantalla.
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
  // Iconos que se muestran en el formulario
  readonly wrenchIcon = Wrench;
  readonly mailIcon = Mail;
  readonly lockIcon = Lock;
  readonly loginIcon = LogIn;

  // Definicion del formulario con sus reglas de validacion
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Estado del componente: si esta cargando o si hay un error que mostrar
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  /** Se ejecuta cuando el usuario apreta "Ingresar". */
  onSubmit(): void {
    // Si el form no cumple las validaciones, no hago nada
    if (this.form.invalid) return;

    // Marco como "cargando" para deshabilitar el boton mientras espero
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => {
        // Login exitoso: voy al dashboard
        this.loading.set(false);
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        // Algo salio mal: muestro el mensaje en rojo bajo el form
        this.loading.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'No se pudo iniciar sesión. Verifique sus credenciales.'),
        );
      },
    });
  }
}
