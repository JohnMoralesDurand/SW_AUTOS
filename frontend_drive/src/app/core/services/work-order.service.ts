// =============================================================================
// WorkOrderService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Persiste ordenes de trabajo y sus items en localStorage. Replica las reglas:
//   - RF-25: actualizar diagnostico.
//   - RF-26: agregar items y recalcular total.
//   - RF-27 + RN-13: cierre solo si hay diagnostico Y al menos un item;
//                   al cerrar marca la cita como completada y notifica al cliente.
//   - El mecanico solo ve sus propias ordenes (filtrado por appointment.mechanic_id).
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MockDataStore } from '../mock/mock-data.store';
import { AuthService } from './auth.service';

const NETWORK_DELAY = 90;

export type WorkOrderStatus = 'open' | 'closed';

export interface WorkOrderItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface WorkOrderPhoto {
  id: number;
  url_foto: string;
  descripcion: string | null;
  tipo: string | null;          // 'entrada' | 'salida' | 'general'
  uploaded_at: string;
  uploaded_by_name?: string | null;
}

export interface WorkOrder {
  id: number;
  appointment_id: number;
  diagnosis: string | null;
  total_amount: number;
  status: WorkOrderStatus;
  closed_at: string | null;
  created_at: string;
  items: WorkOrderItem[];
  photos?: WorkOrderPhoto[];     // fotos de entrada/salida del auto
  mechanic_name?: string | null;
  service_name?: string | null;
  vehicle_plate?: string | null;
  display_number?: number | null;
}

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly store = inject(MockDataStore);
  private readonly auth = inject(AuthService);

  /** Lista las ordenes visibles para el usuario actual. */
  list(): Observable<WorkOrder[]> {
    const me = this.auth.currentUser();
    if (!me) return throwError(() => ({ status: 401 }));
    const db = this.store.snapshot();
    let orders = [...db.workOrders];

    // El mecanico solo ve las ordenes de SUS citas
    if (me.role === 'mechanic') {
      const myApIds = new Set(db.appointments.filter((a) => a.mechanic_id === me.id).map((a) => a.id));
      orders = orders.filter((o) => myApIds.has(o.appointment_id));
    }

    // Numeracion correlativa por orden cronologico (mismo que el backend hacia)
    const chronological = [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const sequence = new Map<number, number>();
    chronological.forEach((wo, idx) => sequence.set(wo.id, idx + 1));

    const sorted = orders.sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((wo) => this.enrich(wo, sequence.get(wo.id) ?? null));
    return of(sorted).pipe(delay(NETWORK_DELAY));
  }

  /** Crea o recupera la orden asociada a una cita (RF-24).
   *
   * En la version mock las ordenes se crean automaticamente cuando una cita
   * pasa a "in_progress" (ver AppointmentService.start). Este metodo se
   * mantiene por compatibilidad con el frontend.
   */
  createForAppointment(appointmentId: number): Observable<WorkOrder> {
    const db = this.store.snapshot();
    let wo = db.workOrders.find((o) => o.appointment_id === appointmentId);
    if (wo) return of(this.enrich(wo, null)).pipe(delay(NETWORK_DELAY));

    const ap = db.appointments.find((a) => a.id === appointmentId);
    if (!ap) return throwError(() => ({ status: 404 }));

    const id = this.store.nextId('workOrder');
    const newWo: WorkOrder = {
      id,
      appointment_id: ap.id,
      diagnosis: null,
      total_amount: ap.frozen_price,
      status: 'open',
      closed_at: null,
      created_at: new Date().toISOString(),
      items: [],
      photos: [],
    };
    this.store.mutate((d) => { d.workOrders.push(newWo); });
    return of(this.enrich(newWo, null)).pipe(delay(NETWORK_DELAY));
  }

  /** Actualiza el diagnostico (RF-25). */
  updateDiagnosis(id: number, diagnosis: string): Observable<WorkOrder> {
    let updated: WorkOrder | undefined;
    this.store.mutate((d) => {
      const wo = d.workOrders.find((x) => x.id === id);
      if (!wo) return;
      wo.diagnosis = diagnosis;
      updated = wo;
    });
    if (!updated) return throwError(() => ({ status: 404 }));
    return of(this.enrich(updated, null)).pipe(delay(NETWORK_DELAY));
  }

  /** Agrega un repuesto/cargo (RF-26). */
  addItem(
    id: number,
    item: { description: string; quantity: number; unit_price: number },
  ): Observable<WorkOrder> {
    let updated: WorkOrder | undefined;
    let err: any = null;
    this.store.mutate((d) => {
      const wo = d.workOrders.find((x) => x.id === id);
      if (!wo) { err = { status: 404 }; return; }
      if (wo.status === 'closed') {
        err = { status: 400, error: { detail: 'La orden ya esta cerrada' } };
        return;
      }
      const itemId = d.nextIds['workOrderItem'] || 1;
      d.nextIds['workOrderItem'] = itemId + 1;
      wo.items.push({
        id: itemId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });
      // Recalcula total = precio congelado + suma de items
      const ap = d.appointments.find((a) => a.id === wo.appointment_id);
      const base = ap ? ap.frozen_price : 0;
      const itemsTotal = wo.items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
      wo.total_amount = base + itemsTotal;
      updated = wo;
    });
    if (err) return throwError(() => err);
    return of(this.enrich(updated!, null)).pipe(delay(NETWORK_DELAY));
  }

  /** Cierra la orden y marca la cita como completada (RF-27, RN-13). */
  close(id: number): Observable<WorkOrder> {
    let updated: WorkOrder | undefined;
    let err: any = null;
    this.store.mutate((d) => {
      const wo = d.workOrders.find((x) => x.id === id);
      if (!wo) { err = { status: 404 }; return; }
      if (!wo.diagnosis) {
        err = { status: 400, error: { detail: 'Falta registrar el diagnostico' } };
        return;
      }
      if (!wo.items || wo.items.length === 0) {
        err = { status: 400, error: { detail: 'Debe registrar al menos un repuesto o cargo' } };
        return;
      }
      wo.status = 'closed';
      wo.closed_at = new Date().toISOString();
      const ap = d.appointments.find((a) => a.id === wo.appointment_id);
      if (ap) {
        ap.status = 'completed';
        // Notificacion al cliente
        const nid = d.nextIds['notification'] || 1;
        d.nextIds['notification'] = nid + 1;
        const service = d.services.find((s) => s.id === ap.service_id);
        const vehicle = d.vehicles.find((v) => v.id === ap.vehicle_id);
        d.notifications.push({
          id: nid,
          user_id: ap.client_id,
          type: 'service_completed',
          title: 'Tu servicio fue completado',
          message: `El servicio '${service?.name ?? ''}' para el vehiculo ` +
                   `${vehicle?.license_plate ?? ''} ha sido finalizado. ` +
                   `Total: S/ ${wo.total_amount.toFixed(2)}. Ya puedes recoger tu auto.`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
      updated = wo;
    });
    if (err) return throwError(() => err);
    return of(this.enrich(updated!, null)).pipe(delay(NETWORK_DELAY));
  }

  /** Detalle de la orden por id de cita (visible para el cliente dueno). */
  getByAppointment(appointmentId: number): Observable<WorkOrder> {
    const me = this.auth.currentUser();
    if (!me) return throwError(() => ({ status: 401 }));
    const db = this.store.snapshot();
    const wo = db.workOrders.find((o) => o.appointment_id === appointmentId);
    if (!wo) return throwError(() => ({ status: 404 }));
    if (me.role === 'client') {
      const ap = db.appointments.find((a) => a.id === appointmentId);
      if (!ap || ap.client_id !== me.id) {
        return throwError(() => ({ status: 403, error: { detail: 'No tiene acceso a esta orden' } }));
      }
    }
    return of(this.enrich(wo, null)).pipe(delay(NETWORK_DELAY));
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  /** Agrega los nombres calculados (mechanic_name, service_name, etc.). */
  private enrich(wo: WorkOrder, displayNumber: number | null): WorkOrder {
    const db = this.store.snapshot();
    const ap = db.appointments.find((a) => a.id === wo.appointment_id);
    const mech = ap?.mechanic_id ? db.users.find((u) => u.id === ap.mechanic_id) : null;
    const service = ap ? db.services.find((s) => s.id === ap.service_id) : null;
    const vehicle = ap ? db.vehicles.find((v) => v.id === ap.vehicle_id) : null;
    const photos = db.photos
      .filter((p) => p.work_order === wo.id)
      .map<WorkOrderPhoto>((p) => ({
        id: p.id,
        url_foto: p.url_foto,
        descripcion: p.descripcion,
        tipo: p.tipo,
        uploaded_at: p.uploaded_at,
        uploaded_by_name: p.uploaded_by_name ?? null,
      }));
    return {
      ...wo,
      items: wo.items ?? [],
      photos,
      mechanic_name: mech ? `${mech.first_name} ${mech.last_name}` : null,
      service_name: service?.name ?? null,
      vehicle_plate: vehicle?.license_plate ?? null,
      display_number: displayNumber,
    };
  }
}
