// Config principal de la app Angular.
// Aca registro los providers globales que necesita toda la app: el router
// con las rutas, HttpClient para hablar con el backend Django, las
// animaciones que requiere PrimeNG y Chart.js para los reportes.
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router con las rutas (standalone, sin NgModule)
    provideRouter(routes),
    // HttpClient con el interceptor que inyecta el token JWT en cada request
    provideHttpClient(withInterceptors([authInterceptor])),
    // PrimeNG necesita animaciones para sus dialogos, dropdowns y tags
    provideAnimations(),
    // Chart.js: registra los controllers para los graficos del dashboard
    provideCharts(withDefaultRegisterables()),
  ],
};
