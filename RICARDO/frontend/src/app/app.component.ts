// app.component.ts
// Es el componente principal de toda la app. Lo unico que hace es mostrar
// la pantalla que corresponda segun la URL del navegador. Para eso uso la
// etiqueta <router-outlet> que actua como un "hueco" donde el router de
// Angular va metiendo el componente correcto (login, dashboard, etc).
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',          // asi lo invoco desde index.html con <app-root>
  standalone: true,              // componente independiente, no necesita NgModule
  imports: [RouterOutlet],       // me trae la etiqueta <router-outlet>
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {}
