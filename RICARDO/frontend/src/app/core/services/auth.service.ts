// auth.service.ts
// Es el "servicio de login": maneja todo lo relacionado a la sesion del
// usuario en un solo lugar.
//   - login(): manda correo y contrasena al backend, recibe un token y
//     lo guarda en localStorage del navegador.
//   - register(): crea una cuenta nueva de cliente.
//   - logout(): borra los datos guardados y manda al usuario al login.
//   - currentUser: variable reactiva con el usuario actualmente logueado.
//   - isAdmin / isClient / isMechanic: ayudantes para preguntar rapido
//     "este usuario es admin?" en cualquier parte de la app.
//
// El token se guarda en localStorage para que la sesion no se pierda al
// recargar la pagina. Otro archivo (auth.interceptor.ts) se encarga de
// pegar ese token a cada llamada al backend, asi no lo repito aca.
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { TokenResponse, User, tokenResponseSchema } from '../models/user.model';

@Injectable({ providedIn: 'root' })   // 'root' = una sola instancia compartida en toda la app
export class AuthService {
  // Direccion del backend para las rutas de login y registro
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Nombres de las "cajitas" donde guardo el token y el usuario en
  // localStorage (la memoria persistente del navegador).
  private readonly TOKEN_KEY = 'autoserv_token';
  private readonly USER_KEY = 'autoserv_user';

  // Variables reactivas: cuando cambian, la pantalla se redibuja sola.
  // currentUser empieza con lo que haya en localStorage (sesion previa).
  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isMechanic = computed(() => this.currentUser()?.role === 'mechanic');
  readonly isClient = computed(() => this.currentUser()?.role === 'client');

  // Angular inyecta automaticamente HttpClient (para llamar al backend) y
  // Router (para cambiar de pagina cuando hace logout).
  constructor(private http: HttpClient, private router: Router) {}

  /** Inicia sesion: manda credenciales al backend y guarda la respuesta. */
  login(email: string, password: string): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/login-json`, { email, password })
      .pipe(
        // tap = "haz algo cuando llegue la respuesta, sin cambiarla"
        tap((response) => {
          // Reviso con Zod que la respuesta tenga la forma que espero
          const parsed = tokenResponseSchema.parse(response);
          this.persistSession(parsed);
        }),
      );
  }

  /** Crea una cuenta nueva (siempre como cliente, los mecanicos los crea el admin). */
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

  /** Cierra la sesion: borra el localStorage y manda al login. */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /** Devuelve el token guardado (lo usa el interceptor). */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Guarda la sesion en localStorage (token + datos del usuario). */
  private persistSession(response: TokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  /** Al iniciar la app, intenta cargar el usuario que estaba logueado. */
  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      // Si el localStorage esta corrupto devuelvo null (vuelve a pedir login)
      return null;
    }
  }
}
