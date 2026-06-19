// AuthService.
// Maneja todo lo relacionado al login del usuario:
//   - login(): manda email/password al backend y guarda el token JWT.
//   - register(): crea una cuenta de cliente.
//   - logout(): borra la sesion y vuelve al login.
//   - currentUser: signal reactivo con el usuario actual.
//   - isAdmin / isClient / isMechanic: computed para usar en los guards y
//     en las plantillas (ej: @if(authService.isAdmin())).
// El token se persiste en localStorage para que la sesion sobreviva al
// refrescar la pagina. El interceptor de
// core/interceptors/auth.interceptor.ts es el que agrega el header
// Authorization en cada request, asi no lo tengo que repetir aca.
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { TokenResponse, User, tokenResponseSchema } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // URL del backend Django (endpoints /api/auth/login y /api/auth/register)
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  // Las dos keys donde guardo la sesion en localStorage para que aguante
  // refrescar la pagina sin tener que volver a loguearse
  private readonly TOKEN_KEY = 'autoserv_token';
  private readonly USER_KEY = 'autoserv_user';

  // Signal con el usuario actual (Angular 17 - reactividad moderna)
  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isMechanic = computed(() => this.currentUser()?.role === 'mechanic');
  readonly isClient = computed(() => this.currentUser()?.role === 'client');

  constructor(private http: HttpClient, private router: Router) {}

  /** Inicia sesion en el sistema (RF-02). */
  login(email: string, password: string): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/login-json`, { email, password })
      .pipe(
        tap((response) => {
          // Validamos la respuesta del API con Zod antes de guardarla
          const parsed = tokenResponseSchema.parse(response);
          this.persistSession(parsed);
        }),
      );
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
    return this.http.post<User>(`${this.apiUrl}/register`, data);
  }

  /** Cierra la sesion del usuario y limpia el almacenamiento (RF-04). */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /** Devuelve el token JWT almacenado para usar en las peticiones. */
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
}
