// =============================================================================
// AuthService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Reemplaza la version que hablaba con el backend Django: ahora valida las
// credenciales contra MockDataStore (localStorage). El "token" es solo un
// identificador random; sirve para mantener compatibilidad con codigo previo
// pero no se valida en ningun lado (no hay servidor).
//
// Mantiene la MISMA API publica que la version HTTP, asi los componentes de
// login/register/layout no necesitan cambios.
//
//   - login()       -> busca el usuario por email, compara contrasena (mock).
//   - register()    -> agrega un nuevo cliente al store.
//   - logout()      -> limpia el localStorage de sesion y vuelve al login.
//   - currentUser   -> signal reactivo del usuario actual.
//
// Patrones aplicados:
//   - signal() + computed() (Angular 17) para reactividad.
//   - rxjs.of() / throwError() para conservar la firma Observable<T>.
// =============================================================================
import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Router } from '@angular/router';

import { TokenResponse, User } from '../models/user.model';
import { MockDataStore } from '../mock/mock-data.store';

// Latencia simulada (ms) para que el UI sienta una llamada real
const NETWORK_DELAY = 150;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'autoserv_token';
  private readonly USER_KEY = 'autoserv_user';

  private readonly store = inject(MockDataStore);
  private readonly router = inject(Router);

  // Signal con el usuario actual (Angular 17 - reactividad moderna)
  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isMechanic = computed(() => this.currentUser()?.role === 'mechanic');
  readonly isClient = computed(() => this.currentUser()?.role === 'client');

  /** Inicia sesion contra el mock (RF-02). */
  login(email: string, password: string): Observable<TokenResponse> {
    const db = this.store.snapshot();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return throwError(() => ({ status: 401, error: { detail: 'Correo o contrasena incorrectos' } }));
    }
    if (!user.is_active) {
      return throwError(() => ({ status: 401, error: { detail: 'Usuario desactivado' } }));
    }
    if (db.passwords[String(user.id)] !== password) {
      return throwError(() => ({ status: 401, error: { detail: 'Correo o contrasena incorrectos' } }));
    }

    const response: TokenResponse = {
      access_token: this.fakeToken(user.id),
      token_type: 'bearer',
      user,
    };
    this.persistSession(response);
    return of(response).pipe(delay(NETWORK_DELAY));
  }

  /** Registra un nuevo cliente (RF-01). */
  register(data: {
    first_name: string;
    last_name: string;
    dni: string;
    email: string;
    phone?: string;
    password: string;
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
      role: 'client',
      specialty: null,
      work_schedule: null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    this.store.mutate((d) => {
      d.users.push(user);
      d.passwords[String(newId)] = data.password;
    });
    return of(user).pipe(delay(NETWORK_DELAY));
  }

  /** Cierra la sesion del usuario y limpia el almacenamiento (RF-04). */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /** Devuelve el token mock almacenado (compatibilidad, no se valida). */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Guarda la sesion en localStorage. */
  private persistSession(response: TokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  /** Recupera el usuario almacenado al iniciar la aplicacion. */
  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  /** Genera un token aleatorio (no se valida, es solo decorativo). */
  private fakeToken(userId: number): string {
    return `mock-${userId}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
