// Componente del Dashboard.
// Es la pantalla de inicio despues del login. Cambia segun el rol:
//   - Admin: ve KPIs (citas, clientes, ingresos), graficos de tendencias y
//     proximas citas.
//   - Cliente / Mecanico: solo ve sus proximas citas.
// Tecnicamente uso signal() para el estado reactivo (Angular 17),
// componentes standalone (sin NgModule) y ng2-charts para los graficos
// (es un wrapper de Chart.js que se usa con <canvas baseChart>).
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
  // ---------------------------------------------------------------------------
  // Iconos de la libreria lucide-angular usados en la plantilla.
  // Se exponen como propiedades para evitar referencias estaticas en el HTML.
  // ---------------------------------------------------------------------------
  readonly calendarCheckIcon = CalendarCheck;
  readonly carIcon = Car;
  readonly trendingIcon = TrendingUp;
  readonly usersIcon = Users;
  readonly plusIcon = Plus;
  readonly calendarIcon = CalendarDays;
  readonly barChartIcon = BarChart3;
  readonly pieChartIcon = PieChart;

  // ---------------------------------------------------------------------------
  // Senales reactivas (signals) que la plantilla observa automaticamente.
  // Cada vez que se llama a .set(...) la vista se actualiza.
  // ---------------------------------------------------------------------------
  readonly summary = signal<DashboardSummary | null>(null);
  readonly upcomingAppointments = signal<Appointment[]>([]);
  readonly topServices = signal<TopService[]>([]);
  readonly appointmentsByDay = signal<AppointmentsByDay[]>([]);

  // ---------------------------------------------------------------------------
  // Configuracion del grafico de barras: "Servicios mas solicitados".
  // Chart.js trabaja con un objeto ChartData que contiene labels (eje X)
  // y datasets (los valores y su estilo).
  // ---------------------------------------------------------------------------
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

  // Opciones visuales del grafico de barras.
  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  // ---------------------------------------------------------------------------
  // Configuracion del grafico de linea: "Citas por dia (ultimos 7 dias)".
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Configuracion del grafico de dona: "Estado de citas".
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // ngOnInit: ciclo de vida que se ejecuta una vez tras crear el componente.
  // Aqui hacemos las cargas iniciales de datos desde el backend.
  // ---------------------------------------------------------------------------
  ngOnInit(): void {
    // Solo el administrador puede ver el resumen + graficos completos.
    if (this.authService.isAdmin()) {
      this.loadAdminMetrics();
    }

    // Todas las roles pueden ver sus citas proximas.
    this.loadUpcomingAppointments();
  }

  // ---------------------------------------------------------------------------
  // Carga las metricas que solo el administrador puede ver:
  //   - Resumen general (tarjetas)
  //   - Top de servicios (grafico de barras)
  //   - Citas por dia ultimos 7 dias (grafico de linea)
  // ---------------------------------------------------------------------------
  private loadAdminMetrics(): void {
    // Resumen general (tarjetas + grafico de dona).
    this.reportService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.updateStatusChart(data);
      },
    });

    // Top de servicios mas solicitados (RF-32).
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

    // Citas agrupadas por dia en los ultimos 7 dias (RF-31).
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
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

  // ---------------------------------------------------------------------------
  // Carga las proximas 5 citas del usuario (pendientes o confirmadas).
  // ---------------------------------------------------------------------------
  private loadUpcomingAppointments(): void {
    this.appointmentService.list().subscribe({
      next: (data) => {
        const upcoming = data
          .filter((a) => a.status === 'pending' || a.status === 'confirmed')
          .slice(0, 5);
        this.upcomingAppointments.set(upcoming);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Convierte el resumen en datos para el grafico de dona de estados.
  // ---------------------------------------------------------------------------
  private updateStatusChart(data: DashboardSummary): void {
    const completed = data.completed_appointments;
    const pending = data.pending_appointments;
    const others = Math.max(
      0,
      data.total_appointments - completed - pending,
    );

    this.appointmentStatusChart.set({
      labels: ['Pendientes', 'Otras en proceso', 'Completadas'],
      datasets: [
        {
          data: [pending, others, completed],
          backgroundColor: ['#fbbf24', '#0ea5e9', '#3fa06f'],
          borderWidth: 0,
        },
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // Convierte "2026-05-09" en "Sab 09" para que el eje X sea legible.
  // ---------------------------------------------------------------------------
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
