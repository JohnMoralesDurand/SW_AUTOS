// Configuracion principal de la aplicacion Angular
// Aqui se definen los providers, las rutas y los interceptores HTTP
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // PrimeNG requiere animaciones para sus componentes (dialogos, dropdowns, etc.)
    provideAnimations(),
    // Registra los controllers/scales de Chart.js para que ng2-charts pueda renderizar
    provideCharts(withDefaultRegisterables()),
  ],
};
