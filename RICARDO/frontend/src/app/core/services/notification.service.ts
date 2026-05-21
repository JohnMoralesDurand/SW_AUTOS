// Servicio Angular para consumir el API de Notificaciones
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  // Estado reactivo compartido para que la campana del header se actualice.
  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);

  constructor(private http: HttpClient) {}

  /** Lista las notificaciones del usuario y refresca el contador. */
  list(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      tap((data) => {
        this.notifications.set(data);
        this.unreadCount.set(data.filter((n) => !n.is_read).length);
      }),
    );
  }

  /** Marca una notificación como leída. */
  markAsRead(id: number): Observable<Notification> {
    return this.http
      .patch<Notification>(`${this.apiUrl}/${id}/read`, {})
      .pipe(tap(() => this.list().subscribe()));
  }
}
