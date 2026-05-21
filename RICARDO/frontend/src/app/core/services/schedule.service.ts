// Servicio Angular para consumir el API de horarios del taller
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

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
  private readonly apiUrl = `${environment.apiUrl}/schedules`;

  constructor(private http: HttpClient) {}

  /** Lista los 7 días de la semana con sus horarios. */
  list(): Observable<BusinessHours[]> {
    return this.http.get<BusinessHours[]>(this.apiUrl);
  }

  /** Actualiza la configuración de un día (solo admin). */
  update(day: number, data: BusinessHoursUpdate): Observable<BusinessHours> {
    return this.http.put<BusinessHours>(`${this.apiUrl}/${day}`, data);
  }
}
