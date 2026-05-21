// =============================================================================
// app.config.ts  -  CONFIGURACION GLOBAL de la aplicacion Angular
// -----------------------------------------------------------------------------
// Aqui se registran los "providers" globales que toda la aplicacion necesita.
// Un provider es un servicio que Angular pone a disposicion de cualquier
// componente mediante inyeccion de dependencias.
//
// Que se registra aqui (en orden):
//
//   1. provideRouter(routes)
//      Activa el sistema de navegacion entre pantallas. Sin esto las URLs
//      como /login o /app/dashboard no funcionarian.
//
//   2. provideHttpClient(withInterceptors([authInterceptor]))
//      Habilita HttpClient (para llamar al API) y registra el interceptor
//      que agrega automaticamente el token JWT en cada peticion saliente.
//
//   3. provideCharts(withDefaultRegisterables())
//      Registra los controllers de Chart.js (lineas, barras, donas) para que
//      ng2-charts pueda renderizar los graficos del dashboard.
//
// Este archivo es el "panel de control central" de la aplicacion.
// =============================================================================
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Registra los controllers/scales de Chart.js para que ng2-charts pueda renderizar
    provideCharts(withDefaultRegisterables()),
  ],
};
