// appointment.service.ts
// Maneja todo lo que tiene que ver con las Citas (la entidad principal
// del sistema). Cada metodo aca corresponde a una accion del flujo:
//   - getAvailability: pregunta al backend que horarios estan libres
//     para un dia y servicio dados.
//   - book: el cliente reserva una cita nueva.
//   - list: trae las citas (filtradas segun el rol; cliente ve las suyas,
//     mecanico las asignadas a el, admin las ve todas).
//   - confirm / cancel / reschedule: cambian el estado de una cita.
//   - assignMechanic: el admin elige que mecanico la atendera.
//   - start: pasa la cita a "en atencion" y crea automaticamente la
//     orden de trabajo asociada.
//
// Tener un service separado por cada entidad (vehiculos, servicios,
// usuarios, etc.) mantiene cada archivo corto y enfocado, en vez de un
// solo ApiService gigante que sea dificil de leer.
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

  // Angular me pasa HttpClient automaticamente al crear el service
  constructor(private http: HttpClient) {}

  /** Pregunta al backend que horarios estan libres para un servicio en
   *  una fecha dada (lo usa el form de "Reservar cita"). */
  getAvailability(serviceId: number, date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(
      `${this.apiUrl}/availability?service_id=${serviceId}&date=${date}`,
    );
  }

  /** El cliente reserva una cita nueva. */
  book(data: {
    vehicle_id: number;
    service_id: number;
    scheduled_at: string;
    notes?: string;
  }): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, data);
  }

  /** Lista las citas. El backend ya filtra segun el rol del que las pide. */
  list(status?: AppointmentStatus): Observable<Appointment[]> {
    const url = status ? `${this.apiUrl}?status_filter=${status}` : this.apiUrl;
    return this.http.get<Appointment[]>(url);
  }

  /** El admin confirma una cita pendiente. */
  confirm(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/confirm`, {});
  }

  /** Cancela la cita con un motivo (lo puede hacer el cliente o el admin). */
  cancel(id: number, reason: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  /** Cambia la fecha/hora de una cita. */
  reschedule(id: number, scheduledAt: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/reschedule`, {
      scheduled_at: scheduledAt,
    });
  }

  /** El admin asigna un mecanico (que tenga la especialidad correcta) a la cita. */
  assignMechanic(id: number, mechanicId: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/assign-mechanic`, {
      mechanic_id: mechanicId,
    });
  }

  /** El admin inicia la atencion: la cita pasa a "en proceso" y el
   *  backend crea automaticamente la orden de trabajo correspondiente. */
  start(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/start`, {});
  }
}
