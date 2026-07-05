// report.service.ts
// Maneja todas las consultas de reportes y estadisticas del taller. Lo
// usa el dashboard del admin (los numeros grandes de arriba y los
// graficos) y la pagina de Reportes.
// Toda la cuenta la hace el backend; aca solo le pido los datos ya
// procesados.
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// Resumen general que se muestra en las 4 tarjetas del dashboard
export interface DashboardSummary {
  total_clients: number;
  total_appointments: number;
  pending_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;   // para separarlas en el grafico de estados
  weekly_income: number;
}

// Cantidad de citas en un dia (para el grafico de barras "Citas por dia")
export interface AppointmentsByDay {
  day: string;   // Formato YYYY-MM-DD
  total: number;
}

// Cada fila del ranking "Servicios mas pedidos"
export interface TopService {
  service: string;
  total: number;
}

// Ingresos generados en un periodo
export interface IncomeReport {
  start: string;
  end: string;
  total_income: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  /** Trae los numeros del dashboard (totales y promedios actuales). */
  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  /** Trae el ranking de servicios mas pedidos. Por defecto los top 5. */
  getTopServices(limit = 5): Observable<TopService[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<TopService[]>(`${this.apiUrl}/top-services`, { params });
  }

  /** Trae cuantas citas hubo cada dia dentro de un rango (para el grafico). */
  getAppointmentsByPeriod(start: Date, end: Date): Observable<AppointmentsByDay[]> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());
    return this.http.get<AppointmentsByDay[]>(`${this.apiUrl}/appointments`, { params });
  }

  /** Trae cuanto se facturo (ordenes cerradas) entre dos fechas. */
  getIncome(start: Date, end: Date): Observable<IncomeReport> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());
    return this.http.get<IncomeReport>(`${this.apiUrl}/income`, { params });
  }
}
