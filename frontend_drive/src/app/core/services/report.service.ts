// =============================================================================
// ReportService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Calcula los reportes leyendo directo del MockDataStore. Replica la logica
// que antes corria en el backend Django/FastAPI:
//   - total_clients = clientes distintos que tienen al menos una cita.
//   - weekly_income = suma de total_amount de ordenes cerradas ultima semana.
//   - getAppointmentsByPeriod = citas agrupadas por dia.
//   - getTopServices = ranking de servicios por cantidad de citas.
//   - getIncome = ingresos del rango indicado.
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MockDataStore } from '../mock/mock-data.store';

const NETWORK_DELAY = 90;

export interface DashboardSummary {
  total_clients: number;
  total_appointments: number;
  pending_appointments: number;
  completed_appointments: number;
  weekly_income: number;
}

export interface AppointmentsByDay {
  day: string;
  total: number;
}

export interface TopService {
  service: string;
  total: number;
}

export interface IncomeReport {
  start: string;
  end: string;
  total_income: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly store = inject(MockDataStore);

  /** Resumen general del dashboard. */
  getSummary(): Observable<DashboardSummary> {
    const db = this.store.snapshot();

    const clientsWithAp = new Set(db.appointments.map((a) => a.client_id));
    const pending = db.appointments.filter((a) => a.status === 'pending').length;
    const completed = db.appointments.filter((a) => a.status === 'completed').length;

    const weekAgo = Date.now() - 7 * 86400000;
    const weeklyIncome = db.workOrders
      .filter((w) => w.status === 'closed' && w.closed_at && new Date(w.closed_at).getTime() >= weekAgo)
      .reduce((acc, w) => acc + (w.total_amount || 0), 0);

    return of({
      total_clients: clientsWithAp.size,
      total_appointments: db.appointments.length,
      pending_appointments: pending,
      completed_appointments: completed,
      weekly_income: weeklyIncome,
    }).pipe(delay(NETWORK_DELAY));
  }

  /** Servicios mas solicitados (ranking limitado por defecto a 5). */
  getTopServices(limit = 5): Observable<TopService[]> {
    const db = this.store.snapshot();
    const counter = new Map<number, number>();
    for (const a of db.appointments) {
      counter.set(a.service_id, (counter.get(a.service_id) || 0) + 1);
    }
    const ranking: TopService[] = db.services.map((s) => ({
      service: s.name,
      total: counter.get(s.id) || 0,
    }));
    ranking.sort((a, b) => b.total - a.total);
    return of(ranking.slice(0, limit)).pipe(delay(NETWORK_DELAY));
  }

  /** Citas agrupadas por dia dentro del rango. */
  getAppointmentsByPeriod(start: Date, end: Date): Observable<AppointmentsByDay[]> {
    const db = this.store.snapshot();
    const buckets = new Map<string, number>();
    for (const a of db.appointments) {
      const d = new Date(a.scheduled_at);
      if (d < start || d > end) continue;
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    const rows = Array.from(buckets.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((x, y) => x.day.localeCompare(y.day));
    return of(rows).pipe(delay(NETWORK_DELAY));
  }

  /** Ingresos generados por ordenes cerradas en un periodo. */
  getIncome(start: Date, end: Date): Observable<IncomeReport> {
    const db = this.store.snapshot();
    const total = db.workOrders
      .filter((w) => {
        if (w.status !== 'closed' || !w.closed_at) return false;
        const t = new Date(w.closed_at);
        return t >= start && t <= end;
      })
      .reduce((acc, w) => acc + (w.total_amount || 0), 0);

    return of({
      start: start.toISOString(),
      end: end.toISOString(),
      total_income: total,
    }).pipe(delay(NETWORK_DELAY));
  }
}
