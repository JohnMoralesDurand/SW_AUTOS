// app.routes.ts
// Aca defino que pantalla mostrar segun la URL. Cada objeto del array es
// una ruta: el "path" es lo que va despues de localhost:4200/, y el
// "loadComponent" dice que componente cargar.
// El truco del import dinamico (loadComponent: () => import(...)) es para
// que cada pantalla se descargue solo cuando el usuario entra a ella,
// no toda junta al inicio. Eso hace que la app cargue mas rapido.
//
// Hay dos grupos de rutas:
//  - PUBLICAS: landing, login, register (cualquiera entra).
//  - PROTEGIDAS: todo lo que esta dentro de "/app". Para entrar tiene que
//    estar logueado (authGuard) y para algunas ademas tiene que ser admin
//    (adminGuard).
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ---- Pantallas publicas (no necesitan login) ----

  // Pagina de bienvenida del taller (la primera que ve un visitante)
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/pages/landing.component').then(
        (m) => m.LandingComponent,
      ),
  },
  // Pantalla de inicio de sesion
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  // Pantalla de registro de cliente nuevo
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },

  // ---- Pantallas protegidas (necesitan login). Todas comparten el
  //      layout principal (sidebar + cabecera con notificaciones) ----
  {
    path: 'app',
    canActivate: [authGuard],   // si no esta logueado, el guard lo manda a /login
    loadComponent: () =>
      import('./shared/layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      // Dashboard (lo ven todos los roles, contenido cambia segun el rol)
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      // Mis vehiculos (cliente lista los suyos, admin ve todos)
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./features/vehicles/pages/vehicles.component').then(
            (m) => m.VehiclesComponent,
          ),
      },
      // Historial de un vehiculo en concreto (lo abre con el id en la URL)
      {
        path: 'vehicles/:id/history',
        loadComponent: () =>
          import('./features/vehicles/pages/vehicle-history.component').then(
            (m) => m.VehicleHistoryComponent,
          ),
      },
      // Catalogo de servicios del taller
      {
        path: 'services',
        loadComponent: () =>
          import('./features/services/pages/services.component').then(
            (m) => m.ServicesComponent,
          ),
      },
      // Lista de citas (cada rol ve las suyas o todas si es admin)
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/appointments/pages/appointments.component').then(
            (m) => m.AppointmentsComponent,
          ),
      },
      // Form para reservar una cita nueva
      {
        path: 'appointments/new',
        loadComponent: () =>
          import('./features/appointments/pages/new-appointment.component').then(
            (m) => m.NewAppointmentComponent,
          ),
      },
      // Usuarios del sistema (SOLO admin)
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/pages/users.component').then(
            (m) => m.UsersComponent,
          ),
      },
      // Reportes y estadisticas (SOLO admin)
      {
        path: 'reports',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/reports/pages/reports.component').then(
            (m) => m.ReportsComponent,
          ),
      },
      // Configuracion de horarios del taller (SOLO admin)
      {
        path: 'schedules',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/schedules/pages/schedules.component').then(
            (m) => m.SchedulesComponent,
          ),
      },
      // Ordenes de trabajo (admin y mecanico, el cliente no entra)
      {
        path: 'work-orders',
        loadComponent: () =>
          import('./features/work-orders/pages/work-orders.component').then(
            (m) => m.WorkOrdersComponent,
          ),
      },
      // Si entra a /app sin nada mas, lo mando al dashboard
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  // Cualquier URL que no exista vuelve a la landing
  { path: '**', redirectTo: '' },
];
