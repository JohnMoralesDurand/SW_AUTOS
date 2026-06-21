// app.config.ts
// Aca activo todo lo que la app necesita para funcionar:
//   1) El router para que las URLs lleven a la pantalla correcta.
//   2) HttpClient para poder hablar con el backend (hacer GET, POST, etc).
//   3) Las animaciones que requiere PrimeNG (menus, alertas, modales).
//   4) Chart.js para que los graficos del dashboard se dibujen.
// Cada "provide*" es como prender un servicio global de la aplicacion.
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Enciendo el sistema de rutas con las rutas que defini en app.routes.ts
    provideRouter(routes),

    // Enciendo HttpClient para llamar al backend. El "interceptor" es como
    // un filtro que pega el token de login a cada peticion automaticamente,
    // asi no tengo que hacerlo en cada llamada.
    provideHttpClient(withInterceptors([authInterceptor])),

    // PrimeNG no muestra sus menus / modales sin esto activado
    provideAnimations(),

    // Chart.js: la libreria que dibuja los graficos de barras y dona del
    // dashboard de administrador.
    provideCharts(withDefaultRegisterables()),
  ],
};
