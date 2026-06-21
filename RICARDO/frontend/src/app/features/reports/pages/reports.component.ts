// reports.component.ts
// Pantalla de "Reportes y estadisticas" (solo para el admin).
// El admin elige un rango de fechas (Desde / Hasta) y aprieta "Aplicar"
// para ver:
//   - Cuantas citas hubo cada dia dentro del rango (grafico de barras).
//   - Distribucion de los servicios mas pedidos (grafico de dona).
//   - Cuanto ingreso genero el taller en ese periodo.
//   - Tabla con el ranking de servicios.
// Los datos los pide al backend a traves del ReportService y los
// graficos los dibuja la libreria Chart.js.
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  LucideAngularModule,
  CalendarRange,
  TrendingUp,
  PieChart,
  BarChart3,
  RefreshCw,
  DollarSign,
} from 'lucide-angular';

import {
  ReportService,
  TopService,
  AppointmentsByDay,
  IncomeReport,
} from '../../../core/services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, BaseChartDirective],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  // Iconos del componente
  readonly calendarIcon = CalendarRange;
  readonly trendingIcon = TrendingUp;
  readonly pieIcon = PieChart;
  readonly barIcon = BarChart3;
  readonly refreshIcon = RefreshCw;
  readonly dollarIcon = DollarSign;

  // ---------------------------------------------------------------------------
  // Estado reactivo: datos crudos descargados del backend.
  // ---------------------------------------------------------------------------
  readonly appointmentsByDay = signal<AppointmentsByDay[]>([]);
  readonly topServices = signal<TopService[]>([]);
  readonly income = signal<IncomeReport | null>(null);
  readonly loading = signal(false);

  // ---------------------------------------------------------------------------
  // Conteo total de citas en el periodo (derivado de appointmentsByDay).
  // computed() = signal calculado automaticamente cuando cambian sus dependencias.
  // ---------------------------------------------------------------------------
  readonly totalAppointments = computed(() =>
    this.appointmentsByDay().reduce((acc, row) => acc + row.total, 0),
  );

  // ---------------------------------------------------------------------------
  // Formulario reactivo para elegir rango de fechas.
  // Por defecto: ultimo mes (30 dias atras hasta hoy).
  // ---------------------------------------------------------------------------
  readonly form = this.fb.nonNullable.group({
    start: [this.toInputDate(this.daysAgo(30)), Validators.required],
    end: [this.toInputDate(new Date()), Validators.required],
  });

  // ---------------------------------------------------------------------------
  // Configuraciones de los graficos
  // ---------------------------------------------------------------------------

  // Citas por dia: grafico de barras vertical.
  appointmentsChart = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Citas',
        backgroundColor: '#3fa06f',
        borderRadius: 8,
      },
    ],
  });

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  // Top servicios: grafico de pastel.
  topServicesChart = signal<ChartData<'pie'>>({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#3fa06f', '#84cc7c', '#fbbf24', '#0ea5e9', '#a78bfa', '#ef4444'],
        borderWidth: 0,
      },
    ],
  });

  readonly pieOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } },
  };

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
  ) {}

  // ---------------------------------------------------------------------------
  // ngOnInit: carga los reportes con el rango por defecto al iniciar la pagina.
  // ---------------------------------------------------------------------------
  ngOnInit(): void {
    this.onApplyFilters();
  }

  // ---------------------------------------------------------------------------
  // Aplica los filtros del formulario y consulta los 3 endpoints de reportes.
  // ---------------------------------------------------------------------------
  onApplyFilters(): void {
    if (this.form.invalid) return;
    const start = new Date(this.form.value.start!);
    const end = new Date(this.form.value.end!);
    end.setHours(23, 59, 59, 999); // incluir todo el dia final

    this.loading.set(true);

    // 1. Citas por dia (RF-31)
    this.reportService.getAppointmentsByPeriod(start, end).subscribe({
      next: (data) => {
        this.appointmentsByDay.set(data);
        this.appointmentsChart.set({
          labels: data.map((d) => this.formatShortDay(d.day)),
          datasets: [
            {
              data: data.map((d) => d.total),
              label: 'Citas',
              backgroundColor: '#3fa06f',
              borderRadius: 8,
            },
          ],
        });
      },
    });

    // 2. Servicios mas solicitados (RF-32)
    this.reportService.getTopServices(6).subscribe({
      next: (data) => {
        this.topServices.set(data);
        this.topServicesChart.set({
          labels: data.map((d) => d.service),
          datasets: [
            {
              data: data.map((d) => d.total),
              backgroundColor: ['#3fa06f', '#84cc7c', '#fbbf24', '#0ea5e9', '#a78bfa', '#ef4444'],
              borderWidth: 0,
            },
          ],
        });
      },
    });

    // 3. Total de ingresos del periodo (RF-33)
    this.reportService.getIncome(start, end).subscribe({
      next: (data) => {
        this.income.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers privados de fechas
  // ---------------------------------------------------------------------------

  /** Devuelve una fecha N dias atras desde hoy. */
  private daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  /** Convierte un Date a formato YYYY-MM-DD para input[type=date]. */
  private toInputDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /** Convierte "2026-05-09" en "Sab 09" para que el eje X sea legible. */
  private formatShortDay(isoDay: string): string {
    const date = new Date(isoDay + 'T00:00:00');
    const dayName = date.toLocaleDateString('es-PE', { weekday: 'short' });
    const dayNum = date.getDate().toString().padStart(2, '0');
    return `${dayName} ${dayNum}`;
  }
}
