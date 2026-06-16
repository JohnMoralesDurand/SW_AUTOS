// =============================================================================
// MainLayoutComponent - Estructura común a todas las páginas autenticadas
// -----------------------------------------------------------------------------
// Compone tres zonas:
//   - Aside (sidebar) izquierdo: navegación + datos del usuario + logout.
//   - Header superior: título de la página + campana de notificaciones.
//   - Main: <router-outlet> donde se inserta el componente de la ruta actual.
//
// El sidebar muestra distintos items según el rol del usuario:
//   - admin: ve todos los items (incluye Reportes, Horarios, Usuarios).
//   - mecánico: ve Dashboard, Servicios, Citas y Órdenes.
//   - cliente: ve Dashboard, Mis vehículos, Servicios y Citas.
// =============================================================================
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Car,
  Wrench,
  CalendarDays,
  Users,
  LogOut,
  Bell,
  BarChart3,
  Clock,
  ClipboardList,
  CheckCircle,
} from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';
import {
  Notification,
  NotificationService,
} from '../../core/services/notification.service';

interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles?: ('client' | 'mechanic' | 'admin')[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
  // Iconos del layout
  readonly dashboardIcon = LayoutDashboard;
  readonly carIcon = Car;
  readonly wrenchIcon = Wrench;
  readonly calendarIcon = CalendarDays;
  readonly usersIcon = Users;
  readonly logoutIcon = LogOut;
  readonly bellIcon = Bell;
  readonly reportsIcon = BarChart3;
  readonly checkIcon = CheckCircle;

  // Estado del dropdown de notificaciones
  readonly notificationsOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Mis vehículos', path: '/app/vehicles', icon: Car, roles: ['client', 'admin'] },
    { label: 'Servicios', path: '/app/services', icon: Wrench },
    { label: 'Citas', path: '/app/appointments', icon: CalendarDays },
    { label: 'Órdenes de trabajo', path: '/app/work-orders', icon: ClipboardList, roles: ['admin', 'mechanic'] },
    { label: 'Reportes', path: '/app/reports', icon: BarChart3, roles: ['admin'] },
    { label: 'Horarios', path: '/app/schedules', icon: Clock, roles: ['admin'] },
    { label: 'Usuarios', path: '/app/users', icon: Users, roles: ['admin'] },
  ];

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // Carga inicial de notificaciones
    this.notificationService.list().subscribe();
  }

  /** Filtra los items según el rol del usuario actual. */
  visibleItems(): NavItem[] {
    const role = this.authService.currentUser()?.role;
    return this.navItems.filter((item) => !item.roles || item.roles.includes(role!));
  }

  toggleNotifications(): void {
    const opening = !this.notificationsOpen();
    this.notificationsOpen.set(opening);
    if (opening) {
      // Refrescar al abrir
      this.notificationService.list().subscribe();
    }
  }

  markRead(notification: Notification): void {
    if (notification.is_read) return;
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
