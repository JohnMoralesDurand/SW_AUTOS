// AppointmentService.
// Mismo patron del ApiService que vimos en clase: un @Injectable que recibe
// HttpClient por DI y expone metodos que devuelven Observable<T>. La unica
// diferencia es que separe los services por entidad (este es solo de Citas)
// en vez de un solo ApiService gigante, porque mi proyecto tiene muchas
// mas tablas que el ejemplo de Alumno.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Appointment,
  AppointmentStatus,
  TimeSlot,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  // URL del backend Django (igual al patron private apiUrl = '...' del profe)
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  // Inyecto HttpClient por el constructor, igual que en el ejemplo de clase
  constructor(private http: HttpClient) {}

  /** Consulta los bloques horarios disponibles para una fecha (RF-17). */
  getAvailability(serviceId: number, date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(
      `${this.apiUrl}/availability?service_id=${serviceId}&date=${date}`,
    );
  }

  /** Reserva una nueva cita (RF-18). */
  book(data: {
    vehicle_id: number;
    service_id: number;
    scheduled_at: string;
    notes?: string;
  }): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, data);
  }

  /** Lista las citas (filtradas segun rol) (RF-22). */
  list(status?: AppointmentStatus): Observable<Appointment[]> {
    const url = status ? `${this.apiUrl}?status_filter=${status}` : this.apiUrl;
    return this.http.get<Appointment[]>(url);
  }

  /** Confirma una cita (RF-19). */
  confirm(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/confirm`, {});
  }

  /** Cancela una cita (RF-20). */
  cancel(id: number, reason: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  /** Reprograma una cita (RF-21). */
  reschedule(id: number, scheduledAt: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/reschedule`, {
      scheduled_at: scheduledAt,
    });
  }

  /** Asigna un mecanico a la cita (RF-23). */
  assignMechanic(id: number, mechanicId: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/assign-mechanic`, {
      mechanic_id: mechanicId,
    });
  }

  /** Inicia el servicio (cambia a en atencion). */
  start(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/start`, {});
  }
}
