// =============================================================================
// Configuracion principal de la app (version mock sin backend)
// -----------------------------------------------------------------------------
// En esta variante de entrega NO hay HttpClient ni AuthInterceptor: todos los
// services consumen el MockDataStore que persiste en localStorage. Solo se
// dejan los providers necesarios para el ruteo, animaciones y Chart.js.
// =============================================================================
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // PrimeNG requiere animaciones para sus componentes (dialogos, dropdowns, etc.)
    provideAnimations(),
    // Registra los controllers/scales de Chart.js para que ng2-charts pueda renderizar
    provideCharts(withDefaultRegisterables()),
  ],
};
