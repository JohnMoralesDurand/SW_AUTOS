// =============================================================================
// adminGuard - Restriccion por rol
// -----------------------------------------------------------------------------
// Bloquea rutas que solo el administrador puede ver (Usuarios, Reportes, etc.).
// Si el usuario actual no es admin, lo enviamos al dashboard general.
//
// Esto es una verificacion de UX: aunque alguien pase manualmente, el backend
// SIEMPRE valida el rol nuevamente con Depends(require_admin) en cada endpoint
// protegido (defensa en profundidad).
// =============================================================================
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  router.navigate(['/app/dashboard']);
  return false;
};
