// =============================================================================
// AppointmentService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Replica TODAS las reglas de negocio que antes estaban en el backend:
//   - RN-03: horario del taller (consulta schedules en el store).
//   - RN-04: no se cruzan citas activas.
//   - RN-05: minimo 2 horas de anticipacion.
//   - RN-07: maximo 3 citas activas por cliente.
//   - RN-11: precio congelado al reservar.
//   - RN-12: especialidad del mecanico debe coincidir con la categoria.
//   - RN-13: solo se inicia con mecanico asignado.
//
// Tambien dispara las notificaciones (APPOINTMENT_BOOKED al reservar y
// SERVICE_COMPLETED al cerrar la orden, manejado en WorkOrderService).
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  Appointment,
  AppointmentStatus,
  TimeSlot,
} from '../models/appointment.model';
import { MockDataStore } from '../mock/mock-data.store';
import { AuthService } from './auth.service';

const NETWORK_DELAY = 100;
const SLOT_INTERVAL_MINUTES = 30;
const MIN_HOURS_AHEAD = 2;     // RN-05
const CANCEL_GRACE_HOURS = 3;  // RN-06
const MAX_ACTIVE = 3;          // RN-07

const ACTIVE_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'in_progress'];

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly store = inject(MockDataStore);
  private readonly auth = inject(AuthService);

  /** Consulta los bloques horarios disponibles para una fecha (RF-17). */
  getAvailability(serviceId: number, date: string): Observable<TimeSlot[]> {
    const db = this.store.snapshot();
    const service = db.services.find((s) => s.id === serviceId && s.is_active);
    if (!service) return throwError(() => ({ status: 404 }));

    const target = new Date(date);
    const weekday = (target.getDay() + 6) % 7; // JS: Domingo=0; queremos Lun=0
    const day = db.schedules.find((s) => s.day_of_week === weekday);
    if (!day || !day.is_open) return of([]).pipe(delay(NETWORK_DELAY));

    const [oh, om] = day.open_time.split(':').map(Number);
    const [ch, cm] = day.close_time.split(':').map(Number);
    const openDt = new Date(target);  openDt.setHours(oh, om, 0, 0);
    const closeDt = new Date(target); closeDt.setHours(ch, cm, 0, 0);

    const dayActive = db.appointments.filter((a) =>
      ACTIVE_STATUSES.includes(a.status) &&
      new Date(a.scheduled_at) >= openDt &&
      new Date(a.scheduled_at) < new Date(closeDt.getTime() + 86400000),
    );

    const slots: TimeSlot[] = [];
    const now = Date.now();
    let cursor = new Date(openDt);
    while (cursor.getTime() + service.duration_minutes * 60000 <= closeDt.getTime()) {
      const end = new Date(cursor.getTime() + service.duration_minutes * 60000);
      let free = true;
      for (const a of dayActive) {
        const aStart = new Date(a.scheduled_at).getTime();
        const aEnd = aStart + a.duration_minutes * 60000;
        if (cursor.getTime() < aEnd && aStart < end.getTime()) { free = false; break; }
      }
      if (cursor.getTime() - now < MIN_HOURS_AHEAD * 3600000) free = false;
      slots.push({ start: cursor.toISOString(), end: end.toISOString(), available: free });
      cursor = new Date(cursor.getTime() + SLOT_INTERVAL_MINUTES * 60000);
    }
    return of(slots).pipe(delay(NETWORK_DELAY));
  }

  /** Reserva una nueva cita (RF-18). */
  book(data: {
    vehicle_id: number;
    service_id: number;
    scheduled_at: string;
    notes?: string;
  }): Observable<Appointment> {
    const me = this.auth.currentUser();
    if (!me) return throwError(() => ({ status: 401 }));
    if (me.role !== 'client') {
      return throwError(() => ({ status: 403, error: { detail: 'Solo los clientes pueden reservar citas' } }));
    }

    const db = this.store.snapshot();
    const vehicle = db.vehicles.find((v) => v.id === data.vehicle_id && v.owner_id === me.id && v.is_active);
    if (!vehicle) return throwError(() => ({ status: 400, error: { detail: 'Vehiculo invalido' } }));

    const service = db.services.find((s) => s.id === data.service_id && s.is_active);
    if (!service) return throwError(() => ({ status: 400, error: { detail: 'Servicio no disponible' } }));

    const scheduled = new Date(data.scheduled_at);
    if (Number.isNaN(scheduled.getTime())) {
      return throwError(() => ({ status: 400, error: { detail: 'Fecha invalida' } }));
    }

    const err = this.validate(scheduled, service.duration_minutes, me.id);
    if (err) return throwError(() => ({ status: 400, error: { detail: err } }));

    const id = this.store.nextId('appointment');
    const appointment: Appointment = {
      id,
      client_id: me.id,
      vehicle_id: vehicle.id,
      service_id: service.id,
      mechanic_id: null,
      scheduled_at: scheduled.toISOString(),
      duration_minutes: service.duration_minutes,
      frozen_price: service.price,
      notes: data.notes ?? null,
      status: 'pending',
      cancellation_reason: null,
      created_at: new Date().toISOString(),
      client_name: `${me.first_name} ${me.last_name}`,
      vehicle_plate: vehicle.license_plate,
      service_name: service.name,
      service_category: service.category ?? null,
      mechanic_name: null,
    };
    this.store.mutate((d) => {
      d.appointments.push(appointment);
      // Notificacion para el cliente (RF-30)
      const nid = d.nextIds['notification'] || 1;
      d.nextIds['notification'] = nid + 1;
      d.notifications.push({
        id: nid,
        user_id: me.id,
        type: 'appointment_booked',
        title: 'Tu cita fue reservada',
        message: `Tu cita para ${service.name} esta pendiente de confirmacion.`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    });
    return of(appointment).pipe(delay(NETWORK_DELAY));
  }

  /** Lista las citas (filtradas segun rol) (RF-22). */
  list(status?: AppointmentStatus): Observable<Appointment[]> {
    const me = this.auth.currentUser();
    if (!me) return throwError(() => ({ status: 401 }));

    let aps = [...this.store.snapshot().appointments];
    if (me.role === 'client') aps = aps.filter((a) => a.client_id === me.id);
    else if (me.role === 'mechanic') aps = aps.filter((a) => a.mechanic_id === me.id);
    if (status) aps = aps.filter((a) => a.status === status);
    aps.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
    return of(aps.map((a) => this.enrich(a))).pipe(delay(NETWORK_DELAY));
  }

  /** Confirma una cita (RF-19). */
  confirm(id: number): Observable<Appointment> {
    return this.transition(id, (a) => {
      if (a.status !== 'pending') {
        throw { status: 400, error: { detail: 'Solo se pueden confirmar citas pendientes' } };
      }
      a.status = 'confirmed';
    });
  }

  /** Cancela una cita (RF-20). */
  cancel(id: number, reason: string): Observable<Appointment> {
    return this.transition(id, (a) => {
      if (a.status === 'completed' || a.status === 'cancelled') {
        throw { status: 400, error: { detail: 'La cita ya esta cerrada' } };
      }
      if (a.status === 'in_progress') {
        throw { status: 400, error: { detail: 'No se puede cancelar una cita en atencion' } };
      }
      a.status = 'cancelled';
      a.cancellation_reason = reason;
    });
  }

  /** Reprograma una cita (RF-21). */
  reschedule(id: number, scheduledAt: string): Observable<Appointment> {
    return this.transition(id, (a) => {
      if (a.status !== 'pending' && a.status !== 'confirmed') {
        throw { status: 400, error: { detail: 'Solo se pueden reprogramar citas activas' } };
      }
      const dt = new Date(scheduledAt);
      if (Number.isNaN(dt.getTime())) {
        throw { status: 400, error: { detail: 'Fecha invalida' } };
      }
      const err = this.validate(dt, a.duration_minutes, a.client_id, a.id);
      if (err) throw { status: 400, error: { detail: err } };
      a.scheduled_at = dt.toISOString();
    });
  }

  /** Asigna un mecanico a la cita (RF-23). */
  assignMechanic(id: number, mechanicId: number): Observable<Appointment> {
    return this.transition(id, (a) => {
      if (a.status !== 'confirmed') {
        throw { status: 400, error: { detail: 'La cita debe estar confirmada para asignar mecanico' } };
      }
      const db = this.store.snapshot();
      const mech = db.users.find((u) => u.id === mechanicId && u.role === 'mechanic' && u.is_active);
      if (!mech) throw { status: 400, error: { detail: 'Mecanico no valido' } };
      // RN-12: especialidad debe coincidir con la categoria del servicio
      if (a.service_category && mech.specialty &&
          a.service_category.toLowerCase() !== mech.specialty.toLowerCase()) {
        throw { status: 400, error: { detail: 'La especialidad del mecanico no coincide con el servicio' } };
      }
      a.mechanic_id = mech.id;
      a.mechanic_name = `${mech.first_name} ${mech.last_name}`;
    });
  }

  /** Inicia el servicio (cambia a en atencion) + crea la orden de trabajo. */
  start(id: number): Observable<Appointment> {
    return this.transition(id, (a) => {
      if (a.status !== 'confirmed') {
        throw { status: 400, error: { detail: 'La cita debe estar confirmada' } };
      }
      if (a.mechanic_id == null) {
        throw { status: 400, error: { detail: 'Debe asignar un mecanico antes de iniciar la atencion' } };
      }
      a.status = 'in_progress';
      // Crear orden de trabajo si no existe
      const db = this.store.snapshot();
      const exists = db.workOrders.some((wo) => wo.appointment_id === a.id);
      if (!exists) {
        const woId = (db.nextIds['workOrder'] || 1);
        this.store.mutate((d) => {
          d.nextIds['workOrder'] = woId + 1;
          d.workOrders.push({
            id: woId,
            appointment_id: a.id,
            diagnosis: null,
            total_amount: a.frozen_price,
            status: 'open',
            closed_at: null,
            created_at: new Date().toISOString(),
            items: [],
            photos: [],
            mechanic_name: a.mechanic_name ?? null,
            service_name: a.service_name ?? null,
            vehicle_plate: a.vehicle_plate ?? null,
            display_number: null,
          });
        });
      }
    });
  }

  // =========================================================================
  // Helpers internos
  // =========================================================================

  /** Aplica una transicion sobre la cita con manejo de errores estandar. */
  private transition(id: number, fn: (a: Appointment) => void): Observable<Appointment> {
    let updated: Appointment | undefined;
    let err: any = null;
    this.store.mutate((d) => {
      const a = d.appointments.find((x) => x.id === id);
      if (!a) { err = { status: 404 }; return; }
      try {
        fn(a);
        updated = a;
      } catch (e) {
        err = e;
      }
    });
    if (err) return throwError(() => err);
    return of(this.enrich(updated!)).pipe(delay(NETWORK_DELAY));
  }

  /** Re-arma los campos calculados (nombres, placa) por si el store no los tiene. */
  private enrich(a: Appointment): Appointment {
    const db = this.store.snapshot();
    const client = db.users.find((u) => u.id === a.client_id);
    const vehicle = db.vehicles.find((v) => v.id === a.vehicle_id);
    const service = db.services.find((s) => s.id === a.service_id);
    const mech = a.mechanic_id ? db.users.find((u) => u.id === a.mechanic_id) : null;
    return {
      ...a,
      client_name: client ? `${client.first_name} ${client.last_name}` : a.client_name,
      vehicle_plate: vehicle?.license_plate ?? a.vehicle_plate,
      service_name: service?.name ?? a.service_name,
      service_category: service?.category ?? a.service_category,
      mechanic_name: mech ? `${mech.first_name} ${mech.last_name}` : null,
    };
  }

  /** Aplica las reglas RN-03, RN-04, RN-05, RN-07 y retorna mensaje de error o null. */
  private validate(
    scheduled: Date, duration: number, clientId: number, excludeId?: number,
  ): string | null {
    // RN-05: anticipacion minima
    if (scheduled.getTime() - Date.now() < MIN_HOURS_AHEAD * 3600000) {
      return 'Debe reservar con al menos 2 horas de anticipacion';
    }
    // RN-03: dentro del horario del dia
    const db = this.store.snapshot();
    const weekday = (scheduled.getDay() + 6) % 7;
    const day = db.schedules.find((s) => s.day_of_week === weekday);
    if (!day || !day.is_open) return 'El taller no atiende ese dia';
    const [oh, om] = day.open_time.split(':').map(Number);
    const [ch, cm] = day.close_time.split(':').map(Number);
    const startMin = scheduled.getHours() * 60 + scheduled.getMinutes();
    const endMin = startMin + duration;
    if (startMin < oh * 60 + om || endMin > ch * 60 + cm) {
      return 'La hora seleccionada esta fuera del horario de atencion';
    }
    // RN-04: sin solapamientos con citas activas
    const end = new Date(scheduled.getTime() + duration * 60000);
    const overlap = db.appointments.some((a) => {
      if (excludeId !== undefined && a.id === excludeId) return false;
      if (!ACTIVE_STATUSES.includes(a.status)) return false;
      const aStart = new Date(a.scheduled_at);
      const aEnd = new Date(aStart.getTime() + a.duration_minutes * 60000);
      return scheduled < aEnd && aStart < end;
    });
    if (overlap) return 'El horario seleccionado ya esta ocupado';
    // RN-07: maximo 3 citas activas por cliente
    if (excludeId === undefined) {
      const active = db.appointments.filter(
        (a) => a.client_id === clientId && ACTIVE_STATUSES.includes(a.status),
      ).length;
      if (active >= MAX_ACTIVE) return 'Ha alcanzado el limite de citas activas';
    }
    return null;
  }
}
