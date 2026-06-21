// admin.guard.ts
// Otro portero, pero mas estricto: solo deja pasar a los administradores.
// Lo uso para proteger las pantallas que son solo del admin (Usuarios,
// Reportes, Horarios). Si entra un cliente o mecanico, lo redirijo al
// dashboard general.
//
// Importante: esto es solo proteccion del lado del navegador. El backend
// igual revisa el rol en cada peticion, asi que aunque alguien tratara
// de saltarse el guard editando el codigo no podria hacer nada.
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si es admin, lo dejo pasar
  if (authService.isAdmin()) {
    return true;
  }

  // Si no es admin, lo mando al dashboard general (no le muestro la pantalla)
  router.navigate(['/app/dashboard']);
  return false;
};
