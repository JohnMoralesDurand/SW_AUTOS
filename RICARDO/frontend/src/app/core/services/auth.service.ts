// AuthService.
// Es la version "ampliada" del AuthService que vimos en LP1 (el que pedia
// el token a /api/token/ y lo guardaba en localStorage). Aca hago lo mismo
// pero ademas:
//   - mantengo el usuario actual con un signal() para que el sidebar y los
//     guards lo lean reactivamente,
//   - tengo computed() para isAdmin / isClient / isMechanic,
//   - valido la respuesta del backend con Zod por si llega algo raro.
// El interceptor que esta en core/interceptors/auth.interceptor.ts es el
// que mete el "Bearer <token>" en cada request, asi no tengo que repetirlo
// en cada metodo.
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { TokenResponse, User, tokenResponseSchema } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // mismo patron del profe: private apiUrl = '...' apuntando al backend
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  // las dos claves de localStorage donde se guarda la sesion (como el
  // 'access' / 'refresh' del ejemplo de LP1)
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
