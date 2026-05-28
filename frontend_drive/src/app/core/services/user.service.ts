// =============================================================================
// UserService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Trabaja sobre MockDataStore (localStorage). Mantiene la misma firma
// Observable<T> que la version HTTP para que los componentes no cambien.
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { User, UserRole } from '../models/user.model';
import { MockDataStore } from '../mock/mock-data.store';
import { AuthService } from './auth.service';

const NETWORK_DELAY = 80;

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly store = inject(MockDataStore);
  private readonly auth = inject(AuthService);

  /** Devuelve el perfil del usuario autenticado. */
  getProfile(): Observable<User> {
    const me = this.auth.currentUser();
    if (!me) return throwError(() => ({ status: 401 }));
    return of(me).pipe(delay(NETWORK_DELAY));
  }

  /** Lista los usuarios con filtros opcionales (RF-07).
   *
   * El parametro specialty filtra mecanicos por especialidad y se usa al
   * asignar un mecanico para que el dropdown solo muestre los compatibles.
   */
  list(role?: UserRole, isActive?: boolean, specialty?: string): Observable<User[]> {
    let users = [...this.store.snapshot().users];
    if (role) users = users.filter((u) => u.role === role);
    if (isActive !== undefined) users = users.filter((u) => u.is_active === isActive);
    if (specialty) {
      const target = specialty.toLowerCase();
      users = users.filter((u) => (u.specialty ?? '').toLowerCase() === target);
    }
    // Mas reciente primero (coincide con el orden del backend)
    users.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return of(users).pipe(delay(NETWORK_DELAY));
  }

  /** Registra un nuevo mecanico (RF-05). */
  createMechanic(data: {
    first_name: string;
    last_name: string;
    dni: string;
    email: string;
    phone?: string;
    password: string;
    specialty?: string;
    work_schedule?: string;
  }): Observable<User> {
    const db = this.store.snapshot();
    if (db.users.some((u) => u.dni === data.dni)) {
      return throwError(() => ({ status: 400, error: { detail: 'El DNI ya se encuentra registrado' } }));
    }
    if (db.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return throwError(() => ({ status: 400, error: { detail: 'El correo ya se encuentra registrado' } }));
    }
    const newId = this.store.nextId('user');
    const user: User = {
      id: newId,
      first_name: data.first_name,
      last_name: data.last_name,
      dni: data.dni,
      email: data.email,
      phone: data.phone ?? null,
      role: 'mechanic',
      specialty: data.specialty ?? null,
      work_schedule: data.work_schedule ?? null,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.store.mutate((d) => {
      d.users.push(user);
      d.passwords[String(newId)] = data.password;
    });
    return of(user).pipe(delay(NETWORK_DELAY));
  }

  /** Activa o desactiva un usuario (RF-08). */
  toggleStatus(id: number): Observable<User> {
    let updated: User | undefined;
    this.store.mutate((d) => {
      const u = d.users.find((x) => x.id === id);
      if (!u) return;
      u.is_active = !u.is_active;
      updated = u;
    });
    if (!updated) return throwError(() => ({ status: 404 }));
    return of(updated).pipe(delay(NETWORK_DELAY));
  }
}
