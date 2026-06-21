// notification.service.ts
// Maneja las notificaciones que aparecen en la campanita del header. El
// backend genera notificaciones automaticas (por ej: cuando el cliente
// reserva una cita o cuando se cierra una orden de trabajo).
//
// Uso variables reactivas (signals) compartidas asi cualquier componente
// puede leer la lista o el contador sin tener que volver a llamar al API.
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Notification {
  id: number;
  user_id: number;
  type: string;       // ej: "appointment_booked", "service_completed"
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  // Lista de notificaciones del usuario y cuantas tiene sin leer.
  // Cualquier componente puede leerlas y se actualizan solas al cambiar.
  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);

  constructor(private http: HttpClient) {}

  /** Pide la lista al backend y refresca las dos variables reactivas. */
  list(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      tap((data) => {
        this.notifications.set(data);
        // El contador es la cantidad de las que aun no se leyeron
        this.unreadCount.set(data.filter((n) => !n.is_read).length);
      }),
    );
  }

  /** Marca como leida una notificacion y vuelve a pedir la lista
   *  (asi el contador del header baja). */
  markAsRead(id: number): Observable<Notification> {
    return this.http
      .patch<Notification>(`${this.apiUrl}/${id}/read`, {})
      .pipe(tap(() => this.list().subscribe()));
  }
}
