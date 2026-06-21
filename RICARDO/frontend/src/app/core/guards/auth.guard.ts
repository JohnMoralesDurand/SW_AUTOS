// auth.guard.ts
// Un "guard" es un portero: el router lo llama ANTES de abrir una ruta
// y le pregunta "¿lo dejo pasar?". Si responde true, se abre la pantalla;
// si responde false, se cancela.
//
// Este guard revisa que el usuario haya iniciado sesion. Si no, lo manda
// al login. Lo uso en app.routes.ts para proteger todo el grupo /app
// (dashboard, vehiculos, citas, etc).
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si tiene sesion activa, puede entrar a la pantalla
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si no tiene sesion, lo mando al login y bloqueo la navegacion
  router.navigate(['/login']);
  return false;
};
