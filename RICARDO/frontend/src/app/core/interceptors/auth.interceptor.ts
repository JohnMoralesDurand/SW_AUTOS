// auth.interceptor.ts
// Es como un "filtro" que se mete en TODAS las peticiones HTTP que la
// app le manda al backend. Hace dos cosas importantes:
//
//   1) Le pega el token de sesion a la peticion para que el backend sepa
//      quien la esta haciendo. Esto se hace en el header "Authorization".
//      Asi yo no tengo que repetir esto en cada llamada de cada service.
//
//   2) Si el backend responde con error 401 (no autorizado, por ej. el
//      token ya expiro), cierra la sesion automaticamente y manda al
//      usuario al login.
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Pido las dependencias que necesito
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Si tengo token, lo agrego al header. Si no, dejo la peticion como esta
  // (por ej. el login no necesita token aun)
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // Dejo seguir la peticion y atrapo errores en el camino
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend respondio "no autorizado", desconecto al usuario
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      // Vuelvo a lanzar el error para que el componente tambien se entere
      return throwError(() => error);
    }),
  );
};
