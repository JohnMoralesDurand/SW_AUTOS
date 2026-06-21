// main.ts
// Aca arranca toda la pagina. Angular necesita un solo archivo que diga
// "empieza por este componente". Le paso el componente principal
// (AppComponent) y la configuracion (rutas, http, etc). Si hay error
// al iniciar, lo muestro en la consola del navegador.
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
