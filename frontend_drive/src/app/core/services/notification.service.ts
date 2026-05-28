// =============================================================================
// NotificationService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Las notificaciones se crean desde otros services (AppointmentService al
// reservar, WorkOrderService al cerrar). Este service solo las lista y
// marca como leidas. Mantiene los signals reactivos para que la campanita
// del header se actualice automaticamente.
// =============================================================================
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { MockDataStore } from '../mock/mock-data.store';
import { AuthService } from './auth.service';

const NETWORK_DELAY = 60;

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
  private readonly store = inject(MockDataStore);
  private readonly auth = inject(AuthService);

  // Estado reactivo compartido para que la campana del header se actualice.
  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);

  /** Lista las notificaciones del usuario y refresca el contador. */
  list(): Observable<Notification[]> {
    const me = this.auth.currentUser();
    if (!me) return of([]);
    const mine = this.store.snapshot().notifications
      .filter((n) => n.user_id === me.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return of(mine).pipe(
      delay(NETWORK_DELAY),
      tap((data) => {
        this.notifications.set(data);
        this.unreadCount.set(data.filter((n) => !n.is_read).length);
      }),
    );
  }

  /** Marca una notificacion como leida. */
  markAsRead(id: number): Observable<Notification> {
    let updated: Notification | undefined;
    this.store.mutate((d) => {
      const n = d.notifications.find((x) => x.id === id);
      if (!n) return;
      n.is_read = true;
      updated = n;
    });
    if (!updated) return throwError(() => ({ status: 404 }));
    return of(updated).pipe(
      delay(NETWORK_DELAY),
      tap(() => this.list().subscribe()),
    );
  }
}
