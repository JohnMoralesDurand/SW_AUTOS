// Rutas de la app.
// Defino el array de rutas con loadComponent en cada una para hacer lazy
// loading: cada pantalla queda en su propio chunk y solo se descarga
// cuando el usuario navega ahi. Eso ayuda a que el bundle inicial pese
// menos y la app cargue mas rapido la primera vez.
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Pagina de bienvenida del taller (landing publica)
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/pages/landing.component').then(
        (m) => m.LandingComponent,
      ),
  },

  // Pantallas publicas de autenticacion
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },

  // Rutas protegidas: requieren sesion iniciada
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./features/vehicles/pages/vehicles.component').then(
            (m) => m.VehiclesComponent,
          ),
      },
      {
        // Historial de un vehículo específico (RF-35, RF-36).
        path: 'vehicles/:id/history',
        loadComponent: () =>
          import('./features/vehicles/pages/vehicle-history.component').then(
            (m) => m.VehicleHistoryComponent,
          ),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./features/services/pages/services.component').then(
            (m) => m.ServicesComponent,
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/appointments/pages/appointments.component').then(
            (m) => m.AppointmentsComponent,
          ),
      },
      {
        path: 'appointments/new',
        loadComponent: () =>
          import('./features/appointments/pages/new-appointment.component').then(
            (m) => m.NewAppointmentComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/pages/users.component').then(
            (m) => m.UsersComponent,
          ),
      },
      {
        // Pagina de reportes y estadisticas (RF-31, RF-32, RF-33).
        // Solo el administrador puede acceder.
        path: 'reports',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/reports/pages/reports.component').then(
            (m) => m.ReportsComponent,
          ),
      },
      {
        // Configuración de horarios del taller (admin).
        path: 'schedules',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/schedules/pages/schedules.component').then(
            (m) => m.SchedulesComponent,
          ),
      },
      {
        // Órdenes de trabajo (admin y mecánico).
        path: 'work-orders',
        loadComponent: () =>
          import('./features/work-orders/pages/work-orders.component').then(
            (m) => m.WorkOrdersComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  // Cualquier ruta no encontrada vuelve a la pagina de inicio
  { path: '**', redirectTo: '' },
];
