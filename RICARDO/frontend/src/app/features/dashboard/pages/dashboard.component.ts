// dashboard.component.ts
// Es la pantalla principal despues del login. Lo que se muestra depende
// del rol del usuario:
//   - Admin: ve numeros generales (cantidad de citas, clientes, ingresos
//     de la semana), tres graficos (citas por dia, estado, top servicios)
//     y sus proximas citas.
//   - Cliente / Mecanico: solo ve sus proximas citas.
//
// Los graficos los hace una libreria llamada Chart.js, y los conecto a
// Angular con ng2-charts. Cada grafico tiene su propia configuracion
// (colores, escala, leyenda).
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  LucideAngularModule,
  CalendarCheck,
  Car,
  TrendingUp,
  Users,
  Plus,
  CalendarDays,
  BarChart3,
  PieChart,
} from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import {
  DashboardSummary,
  ReportService,
  TopService,
  AppointmentsByDay,
} from '../../../core/services/report.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  // Iconos que uso en la plantilla del dashboard. Los expongo como
  // propiedades para no tener que importarlos directamente en el HTML.
  readonly calendarCheckIcon = CalendarCheck;
  readonly carIcon = Car;
  readonly trendingIcon = TrendingUp;
  readonly usersIcon = Users;
  readonly plusIcon = Plus;
  readonly calendarIcon = CalendarDays;
  readonly barChartIcon = BarChart3;
  readonly pieChartIcon = PieChart;

  // Variables reactivas con los datos que se muestran en pantalla.
  // Cuando les hago .set(...) la pantalla se redibuja sola.
  readonly summary = signal<DashboardSummary | null>(null);
  readonly upcomingAppointments = signal<Appointment[]>([]);
  readonly topServices = signal<TopService[]>([]);
  readonly appointmentsByDay = signal<AppointmentsByDay[]>([]);

  // Datos del grafico de barras "Servicios mas solicitados". Chart.js
  // pide un objeto con "labels" (lo que va en el eje X) y "datasets"
  // (los valores con su color).
  topServicesChart = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Solicitudes',
        backgroundColor: '#3fa06f',
        borderRadius: 8,
      },
    ],
  });

  // Opciones de estilo del grafico de barras (sin leyenda, eje Y desde 0)
  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  // Datos del grafico de linea "Citas por dia (ultimos 7 dias)".
  appointmentsChart = signal<ChartData<'line'>>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Citas',
        borderColor: '#3fa06f',
        backgroundColor: 'rgba(63, 160, 111, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#3fa06f',
        pointRadius: 4,
      },
    ],
  });

  readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  // Datos del grafico de dona "Estado de citas".
  appointmentStatusChart = signal<ChartData<'doughnut'>>({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#fbbf24', '#0ea5e9', '#3fa06f', '#ef4444'],
        borderWidth: 0,
      },
    ],
  });

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: { legend: { position: 'bottom' } },
  };

  constructor(
    public authService: AuthService,
    private reportService: ReportService,
    private appointmentService: AppointmentService,
  ) {}

  /** Se ejecuta cuando se crea el componente. Aca decido que datos pido
   *  segun el rol del usuario que esta viendo el dashboard. */
  ngOnInit(): void {
    // Solo el admin puede ver los numeros generales y los graficos
    if (this.authService.isAdmin()) {
      this.loadAdminMetrics();
    }
    // Todos los roles ven sus proximas citas
    this.loadUpcomingAppointments();
  }

  /** Pide los datos del backend para los 4 numeros grandes y los 3
   *  graficos del dashboard del admin. */
  private loadAdminMetrics(): void {
    // Resumen general: cantidad de citas, clientes, ingresos
    this.reportService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.updateStatusChart(data);
      },
    });

    // Ranking de los 5 servicios mas pedidos -> grafico de barras
    this.reportService.getTopServices(5).subscribe({
      next: (data) => {
        this.topServices.set(data);
        this.topServicesChart.set({
          labels: data.map((d) => d.service),
          datasets: [
            {
              data: data.map((d) => d.total),
              label: 'Solicitudes',
              backgroundColor: '#3fa06f',
              borderRadius: 8,
            },
          ],
        });
      },
    });

    // Citas por dia en los ultimos 7 dias -> grafico de linea
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);  // hace 6 dias atras + hoy = 7 dias
    this.reportService.getAppointmentsByPeriod(start, end).subscribe({
      next: (data) => {
        this.appointmentsByDay.set(data);
        this.appointmentsChart.set({
          labels: data.map((d) => this.formatShortDay(d.day)),
          datasets: [
            {
              data: data.map((d) => d.total),
              label: 'Citas',
              borderColor: '#3fa06f',
              backgroundColor: 'rgba(63, 160, 111, 0.15)',
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#3fa06f',
              pointRadius: 4,
            },
          ],
        });
      },
    });
  }

  /** Pide la lista de citas y arma las "proximas": solo pendientes o
   *  confirmadas cuya fecha aun no paso, ordenadas de la mas cercana a
   *  la mas lejana (antes salian al reves e incluian citas vencidas). */
  private loadUpcomingAppointments(): void {
    this.appointmentService.list().subscribe({
      next: (data) => {
        const now = Date.now();
        const upcoming = data
          .filter(
            (a) =>
              (a.status === 'pending' || a.status === 'confirmed') &&
              new Date(a.scheduled_at).getTime() >= now,
          )
          .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
          .slice(0, 5);
        this.upcomingAppointments.set(upcoming);
      },
    });
  }

  /** Convierte los numeros del resumen en los datos del grafico de dona.
   *  Las canceladas van en su propia porcion (antes se mezclaban con
   *  las que estaban en proceso). */
  private updateStatusChart(data: DashboardSummary): void {
    const completed = data.completed_appointments;
    const pending = data.pending_appointments;
    const cancelled = data.cancelled_appointments ?? 0;
    // "En proceso" = confirmadas + en atencion (lo que no es ninguna de las otras)
    const inProgress = Math.max(
      0,
      data.total_appointments - completed - pending - cancelled,
    );

    this.appointmentStatusChart.set({
      labels: ['Pendientes', 'En proceso', 'Completadas', 'Canceladas'],
      datasets: [
        {
          data: [pending, inProgress, completed, cancelled],
          backgroundColor: ['#fbbf24', '#0ea5e9', '#3fa06f', '#ef4444'],
          borderWidth: 0,
        },
      ],
    });
  }

  /** Convierte una fecha tipo "2026-05-09" en algo mas corto y legible
   *  como "Sab 09" para mostrar en el eje X del grafico. */
  private formatShortDay(isoDay: string): string {
    const date = new Date(isoDay + 'T00:00:00');
    const dayName = date.toLocaleDateString('es-PE', { weekday: 'short' });
    const dayNum = date.getDate().toString().padStart(2, '0');
    return `${dayName} ${dayNum}`;
  }

  /** Devuelve la clase CSS del badge segun el estado de la cita. */
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return map[status] ?? 'badge-muted';
  }

  /** Etiqueta legible (en espanol) para cada estado de cita. */
  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      in_progress: 'En atención',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return map[status] ?? status;
  }
}
