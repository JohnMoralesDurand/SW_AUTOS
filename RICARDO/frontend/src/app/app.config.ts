// Config principal de la app Angular.
// Aca registro los providers globales: el router, HttpClient (para llamar
// al backend Django como vimos en clase), animaciones para PrimeNG y
// Chart.js para los graficos del dashboard.
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // routing standalone (sin NgModule) tal como lo hizo el profe
    provideRouter(routes),
    // HttpClient + interceptor que agrega el token JWT a cada request
    provideHttpClient(withInterceptors([authInterceptor])),
    // PrimeNG necesita animaciones para los dialogos / dropdowns / tags
    provideAnimations(),
    // ng2-charts: registra los controllers de Chart.js para los reportes
    provideCharts(withDefaultRegisterables()),
  ],
};
