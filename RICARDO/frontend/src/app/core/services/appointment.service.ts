// =============================================================================
// AppointmentService - Cliente HTTP del modulo de Citas
// -----------------------------------------------------------------------------
// Encapsula todas las llamadas al backend relacionadas a las citas:
//   - Consultar disponibilidad de horarios (RF-17).
//   - Reservar una nueva cita (RF-18, RN-04, RN-05, RN-07, RN-11).
//   - Listar citas filtradas por estado (RF-22).
//   - Confirmar (RF-19), cancelar (RF-20), reprogramar (RF-21).
//   - Asignar un mecanico segun especialidad (RF-23, RN-12).
//   - Iniciar la atencion (cambio de estado RN-09).
//
// Cada componente de pantalla solo invoca a estos metodos; toda la logica de
// negocio reside en el backend, garantizando que las reglas se apliquen
// uniformemente sin importar quien llame al API.
// =============================================================================
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
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

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
