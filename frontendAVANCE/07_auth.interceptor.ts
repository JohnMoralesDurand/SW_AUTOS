// =============================================================================
// AuthInterceptor
// -----------------------------------------------------------------------------
// Es una funcion (HttpInterceptorFn de Angular 17) que se ejecuta en CADA
// peticion HTTP que sale del frontend. Hace dos cosas claves:
//
//   1. Inyecta el token JWT en el header "Authorization" para que el backend
//      pueda identificar al usuario en cualquier endpoint protegido.
//
//   2. Si el backend responde 401 (token expirado o invalido), cierra sesion
//      automaticamente y redirige a la pantalla de login.
//
// Asi cada componente puede llamar al API sin preocuparse por la autenticacion;
// el interceptor lo hace de manera transversal.
// =============================================================================
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Si hay token, lo agregamos en el header Authorization
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el token es invalido o expiro redirigimos al login
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
