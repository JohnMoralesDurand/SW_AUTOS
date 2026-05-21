// Servicio Angular para consumir el API de reportes y estadisticas (RF-31, RF-32, RF-33).
// Este servicio centraliza todas las llamadas HTTP relacionadas a metricas
// del taller para que cualquier componente (dashboard, reportes) pueda usarlo.
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// Resumen general que se muestra en las tarjetas del dashboard.
export interface DashboardSummary {
  total_clients: number;
  total_appointments: number;
  pending_appointments: number;
  completed_appointments: number;
  weekly_income: number;
}

// Cantidad de citas registradas en un dia especifico.
export interface AppointmentsByDay {
  day: string;   // Fecha en formato YYYY-MM-DD
  total: number; // Numero de citas ese dia
}

// Servicio mas solicitado y la cantidad de veces pedido.
export interface TopService {
  service: string;
  total: number;
}

// Resultado del reporte de ingresos del taller.
export interface IncomeReport {
  start: string;
  end: string;
  total_income: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  // URL base del modulo de reportes en el backend.
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  /** Resumen general del dashboard (total de citas, clientes, ingresos semanales). */
  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  /** Servicios mas solicitados, ranking limitado por defecto a 5 (RF-32). */
  getTopServices(limit = 5): Observable<TopService[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<TopService[]>(`${this.apiUrl}/top-services`, { params });
  }

  /** Citas agrupadas por dia dentro de un rango (RF-31). */
  getAppointmentsByPeriod(start: Date, end: Date): Observable<AppointmentsByDay[]> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());
    return this.http.get<AppointmentsByDay[]>(`${this.apiUrl}/appointments`, { params });
  }

  /** Ingresos generados por ordenes cerradas en un periodo (RF-33). */
  getIncome(start: Date, end: Date): Observable<IncomeReport> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());
    return this.http.get<IncomeReport>(`${this.apiUrl}/income`, { params });
  }
}
