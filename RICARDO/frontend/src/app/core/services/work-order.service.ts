// work-order.service.ts
// Maneja las Ordenes de Trabajo. Una orden se crea sola cuando una cita
// pasa a "en atencion" y representa el trabajo del mecanico sobre el auto.
// El mecanico la abre, escribe el diagnostico, agrega los repuestos que
// uso y al final la cierra. Cuando cierra, la cita queda "completada".
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// Una orden esta "open" mientras el mecanico la trabaja, y "closed"
// cuando se cierra y se le cobra al cliente.
export type WorkOrderStatus = 'open' | 'closed';

// Cada repuesto / cargo que el mecanico agrega a la orden
export interface WorkOrderItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
}

// Cada foto que el mecanico sube como evidencia
export interface WorkOrderPhoto {
  id: number;
  url_foto: string;
  descripcion: string | null;
  tipo: string | null;          // 'entrada' (al recibir el auto) / 'salida' (al entregarlo) / 'general'
  uploaded_at: string;
  uploaded_by_name?: string | null;
}

// La orden de trabajo en si
export interface WorkOrder {
  id: number;
  // En el backend Django esta FK se llama "appointment" (no "appointment_id")
  appointment: number;
  diagnosis: string | null;       // texto que escribe el mecanico
  total_amount: number;           // precio base + items
  status: WorkOrderStatus;
  closed_at: string | null;
  created_at: string;
  items: WorkOrderItem[];         // repuestos y cargos agregados
  photos?: WorkOrderPhoto[];      // fotos de entrada/salida del auto
  // Campos "amigables" que el backend ya resuelve para mostrar en la lista
  mechanic_name?: string | null;
  service_name?: string | null;
  vehicle_plate?: string | null;
  display_number?: number | null;
}

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly apiUrl = `${environment.apiUrl}/work-orders`;

  constructor(private http: HttpClient) {}

  /** Lista las ordenes de trabajo (cada rol ve solo lo que le corresponde). */
  list(): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(this.apiUrl);
  }

  /** Crea una orden vinculada a una cita (en la practica casi no se usa
   *  porque la orden se crea sola cuando la cita pasa a "en atencion"). */
  createForAppointment(appointmentId: number): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(this.apiUrl, { appointment_id: appointmentId });
  }

  /** Guarda el diagnostico que escribio el mecanico. */
  updateDiagnosis(id: number, diagnosis: string): Observable<WorkOrder> {
    return this.http.put<WorkOrder>(`${this.apiUrl}/${id}/diagnosis`, { diagnosis });
  }

  /** Agrega un repuesto o cargo a la orden. El backend recalcula el total. */
  addItem(
    id: number,
    item: { description: string; quantity: number; unit_price: number },
  ): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.apiUrl}/${id}/items`, item);
  }

  /** Cierra la orden. Esto exige que ya haya diagnostico y al menos un
   *  item, ademas marca la cita como completada. */
  close(id: number): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.apiUrl}/${id}/close`, {});
  }

  /** Trae la orden a partir del id de cita (lo usa el cliente cuando
   *  quiere ver el detalle de su propio servicio). */
  getByAppointment(appointmentId: number): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${this.apiUrl}/by-appointment/${appointmentId}`);
  }
}
