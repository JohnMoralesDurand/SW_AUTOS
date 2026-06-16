// =============================================================================
// main.ts  -  PUNTO DE ENTRADA de la aplicacion Angular
// -----------------------------------------------------------------------------
// Este es el PRIMER archivo que el navegador ejecuta cuando carga la pagina.
// Aunque solo tiene 3 lineas de codigo, es fundamental: arranca toda la app.
//
// Que hace cada parte:
//   1. bootstrapApplication: funcion de Angular 17 que "enciende" la aplicacion.
//      Recibe el componente raiz (AppComponent) y la configuracion global.
//   2. AppComponent: es el componente padre de todo. Contiene <router-outlet>
//      donde se renderizan los demas componentes segun la URL actual.
//   3. appConfig: trae los providers globales (router, HTTP, interceptores).
//
// Analogia: si la aplicacion fuera un auto, main.ts es la llave de ignicion.
// =============================================================================
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
