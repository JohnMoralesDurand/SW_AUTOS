// schedule.service.ts
// Maneja el horario de atencion del taller. La tabla tiene 7 filas (una
// por dia de la semana) y para cada una se puede marcar si esta abierto
// y el rango de horario. Lo usa el modulo de citas para saber que dias
// se aceptan reservas y a que horas.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// Un bloque horario dentro de un dia (ej: manana 08:00-12:00)
export interface ScheduleBlock {
  open_time: string;   // "HH:MM"
  close_time: string;  // "HH:MM"
}

// Asi viene cada dia desde el backend. Un dia puede tener VARIOS bloques
// (horario partido: manana y tarde). open_time/close_time son el rango
// total del dia, solo informativos.
export interface BusinessHours {
  id: number;
  day_of_week: number;       // 0 = Lunes, 1 = Martes, ..., 6 = Domingo
  is_open: boolean;
  bloques: ScheduleBlock[];  // los bloques reales del dia
  open_time: string | null;  // apertura del primer bloque
  close_time: string | null; // cierre del ultimo bloque
}

// Lo que mando cuando guardo cambios de un dia: el estado y TODOS sus
// bloques (el backend reemplaza los que tenia por estos)
export interface BusinessHoursUpdate {
  is_open: boolean;
  bloques: ScheduleBlock[];
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly apiUrl = `${environment.apiUrl}/schedules`;

  constructor(private http: HttpClient) {}

  /** Trae los 7 dias de la semana con su horario actual. */
  list(): Observable<BusinessHours[]> {
    return this.http.get<BusinessHours[]>(this.apiUrl);
  }

  /** Guarda los cambios de un dia (solo lo puede hacer el admin). */
  update(day: number, data: BusinessHoursUpdate): Observable<BusinessHours> {
    return this.http.put<BusinessHours>(`${this.apiUrl}/${day}`, data);
  }
}
