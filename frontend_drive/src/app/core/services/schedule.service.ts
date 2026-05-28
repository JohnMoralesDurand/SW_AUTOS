// =============================================================================
// ScheduleService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Gestiona el horario semanal del taller (7 dias) usando MockDataStore.
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MockDataStore } from '../mock/mock-data.store';

const NETWORK_DELAY = 70;

export interface BusinessHours {
  id: number;
  day_of_week: number; // 0=Lunes ... 6=Domingo
  is_open: boolean;
  open_time: string; // "HH:MM"
  close_time: string;
}

export interface BusinessHoursUpdate {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly store = inject(MockDataStore);

  /** Lista los 7 dias de la semana con sus horarios. */
  list(): Observable<BusinessHours[]> {
    const sorted = [...this.store.snapshot().schedules].sort(
      (a, b) => a.day_of_week - b.day_of_week,
    );
    return of(sorted).pipe(delay(NETWORK_DELAY));
  }

  /** Actualiza la configuracion de un dia (solo admin). */
  update(day: number, data: BusinessHoursUpdate): Observable<BusinessHours> {
    let updated: BusinessHours | undefined;
    this.store.mutate((d) => {
      const sch = d.schedules.find((x) => x.day_of_week === day);
      if (!sch) return;
      sch.is_open = data.is_open;
      sch.open_time = data.open_time;
      sch.close_time = data.close_time;
      updated = sch;
    });
    if (!updated) return throwError(() => ({ status: 404 }));
    return of(updated).pipe(delay(NETWORK_DELAY));
  }
}
