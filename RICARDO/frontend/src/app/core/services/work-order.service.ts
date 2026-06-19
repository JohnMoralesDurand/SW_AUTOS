// Servicio Angular para consumir el API de Órdenes de Trabajo (RF-24..RF-27)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

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
  // El backend lo serializa como "appointment" (FK ID de la cita asociada).
  appointment: number;
  diagnosis: string | null;
  total_amount: number;
  status: WorkOrderStatus;
  closed_at: string | null;
  created_at: string;
  items: WorkOrderItem[];
  photos?: WorkOrderPhoto[];     // nuevo: fotos de entrada/salida del auto
  mechanic_name?: string | null;
  service_name?: string | null;
  vehicle_plate?: string | null;
  display_number?: number | null;
}

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly apiUrl = `${environment.apiUrl}/work-orders`;

  constructor(private http: HttpClient) {}

  list(): Observable<WorkOrder[]> {
    return this.http.get<WorkOrder[]>(this.apiUrl);
  }

  /** Crea o recupera la orden asociada a una cita (RF-24). */
  createForAppointment(appointmentId: number): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(this.apiUrl, { appointment_id: appointmentId });
  }

  /** Actualiza el diagnóstico (RF-25). */
  updateDiagnosis(id: number, diagnosis: string): Observable<WorkOrder> {
    return this.http.put<WorkOrder>(`${this.apiUrl}/${id}/diagnosis`, { diagnosis });
  }

  /** Agrega un repuesto/cargo (RF-26). */
  addItem(
    id: number,
    item: { description: string; quantity: number; unit_price: number },
  ): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.apiUrl}/${id}/items`, item);
  }

  /** Cierra la orden y marca la cita como completada (RF-27, RN-13). */
  close(id: number): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(`${this.apiUrl}/${id}/close`, {});
  }

  /** Detalle de la orden por id de cita (visible para el cliente dueño). */
  getByAppointment(appointmentId: number): Observable<WorkOrder> {
    return this.http.get<WorkOrder>(`${this.apiUrl}/by-appointment/${appointmentId}`);
  }
}
