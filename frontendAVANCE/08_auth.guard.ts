// =============================================================================
// authGuard - Proteccion de rutas privadas
// -----------------------------------------------------------------------------
// Un "guard" es una funcion que el router Angular ejecuta antes de activar una
// ruta. Si retorna true, la navegacion procede; si retorna false, se cancela.
//
// Aqui validamos que exista una sesion iniciada (token JWT en localStorage).
// Si no hay sesion, redirigimos al usuario a /login.
//
// Se aplica en app.routes.ts a todas las rutas hijas de /app.
// =============================================================================
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
