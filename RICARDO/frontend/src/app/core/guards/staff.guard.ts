// staff.guard.ts
// Portero para las pantallas del personal del taller: deja pasar al
// admin y al mecanico, pero no al cliente. Lo uso en la ruta de
// Ordenes de trabajo: el backend igual rechazaria las peticiones de un
// cliente, pero asi ni siquiera le muestro una pantalla vacia con error.
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const staffGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Admin o mecanico pueden entrar
  if (authService.isAdmin() || authService.isMechanic()) {
    return true;
  }

  // El cliente vuelve a su dashboard
  router.navigate(['/app/dashboard']);
  return false;
};
