// user.service.ts
// Es el "puente" del frontend con la tabla de usuarios del backend.
// Cada metodo aca corresponde a una accion: pedir mi perfil, listar
// usuarios filtrados, crear un mecanico nuevo, editarlo, etc.
// Lo usan los componentes de "Usuarios" y "Citas" (para listar los
// mecanicos al asignar uno a una cita).
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  // URL base del recurso "usuarios" en el backend
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /** Trae los datos del usuario que esta logueado en este momento. */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  /**
   * Lista los usuarios. Acepta filtros opcionales:
   *   - role: para traer solo "client", "mechanic" o "admin".
   *   - isActive: para traer solo activos o solo desactivados.
   *   - specialty: para filtrar mecanicos por su especialidad (lo uso
   *     cuando el admin va a asignar un mecanico a una cita: solo se
   *     muestran los que tienen la especialidad del servicio).
   */
  list(role?: UserRole, isActive?: boolean, specialty?: string): Observable<User[]> {
    const params: string[] = [];
    if (role) params.push(`role=${role}`);
    if (isActive !== undefined) params.push(`is_active=${isActive}`);
    if (specialty) params.push(`specialty=${encodeURIComponent(specialty)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<User[]>(`${this.apiUrl}${query}`);
  }

  /** Registra un mecanico nuevo en el sistema (solo lo puede hacer el admin). */
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
    return this.http.post<User>(`${this.apiUrl}/mechanics`, data);
  }

  /** Activa o desactiva un usuario (no se borra de la base de datos). */
  toggleStatus(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  /** Edita los datos de un mecanico (nombre, telefono, especialidad, horario). */
  update(id: number, data: Partial<{
    first_name: string;
    last_name: string;
    phone: string;
    specialty: string;
    work_schedule: string;
  }>): Observable<User> {
    // PATCH = "actualiza solo los campos que mando, no toques el resto"
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data);
  }
}
