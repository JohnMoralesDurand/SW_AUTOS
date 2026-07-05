// main-layout.component.ts
// Es el "armazon" que envuelve a todas las pantallas despues de iniciar
// sesion. Tiene tres partes:
//   - Sidebar a la izquierda: menu de navegacion, datos del usuario y
//     boton de cerrar sesion.
//   - Cabecera arriba: titulo de la pantalla actual y campanita de
//     notificaciones.
//   - Zona central: aca se mete la pantalla que corresponda a la URL
//     actual (lo hace el <router-outlet>).
//
// El menu cambia segun el rol:
//   - Admin: ve todos los items (incluye Reportes, Horarios, Usuarios).
//   - Mecanico: ve Dashboard, Servicios, Citas y Ordenes.
//   - Cliente: ve Dashboard, Mis vehiculos, Servicios y Citas.
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
  Menu,
  X,
} from 'lucide-angular';

import { AuthService } from '../../core/services/auth.service';
import {
  Notification,
  NotificationService,
} from '../../core/services/notification.service';

// Cada opcion del menu del sidebar
interface NavItem {
  label: string;                               // texto que se ve
  path: string;                                // URL a la que lleva
  icon: any;                                   // icono de Lucide
  roles?: ('client' | 'mechanic' | 'admin')[]; // que roles lo ven (si vacio, todos)
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
  // Iconos que uso en el sidebar y la cabecera (los importe de lucide arriba)
  readonly dashboardIcon = LayoutDashboard;
  readonly carIcon = Car;
  readonly wrenchIcon = Wrench;
  readonly calendarIcon = CalendarDays;
  readonly usersIcon = Users;
  readonly logoutIcon = LogOut;
  readonly bellIcon = Bell;
  readonly reportsIcon = BarChart3;
  readonly checkIcon = CheckCircle;
  readonly menuIcon = Menu;
  readonly closeIcon = X;

  // Controla si la lista de notificaciones esta abierta o cerrada
  readonly notificationsOpen = signal(false);

  // Controla el menu hamburguesa en pantallas chicas (el sidebar normal
  // se oculta en movil, asi que ahi la navegacion sale de este menu)
  readonly mobileMenuOpen = signal(false);

  // Definicion del menu. Si un item tiene "roles", solo se muestra a esos
  // roles; si no tiene, lo ven todos.
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

  // Al entrar al layout, pido las notificaciones del usuario para mostrar
  // el contador en la campanita
  ngOnInit(): void {
    this.notificationService.list().subscribe();
  }

  /** Devuelve solo los items del menu que el usuario actual puede ver. */
  visibleItems(): NavItem[] {
    const role = this.authService.currentUser()?.role;
    return this.navItems.filter((item) => !item.roles || item.roles.includes(role!));
  }

  /** Abre o cierra el dropdown de notificaciones. Si lo abre, refresca la
   *  lista para mostrar lo mas reciente. */
  toggleNotifications(): void {
    const opening = !this.notificationsOpen();
    this.notificationsOpen.set(opening);
    if (opening) {
      this.notificationService.list().subscribe();
    }
  }

  /** Marca como leida una notificacion cuando el usuario la clickea. */
  markRead(notification: Notification): void {
    if (notification.is_read) return;  // si ya estaba leida, no hago nada
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  /** Abre/cierra el menu de navegacion en celulares. */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  /** Cierra la sesion (delegado al AuthService). */
  onLogout(): void {
    this.authService.logout();
  }
}
