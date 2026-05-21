// Servicio para interactuar con el API de usuarios
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /** Devuelve el perfil del usuario autenticado. */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  /** Lista los usuarios con filtros opcionales (RF-07).
   *
   * El parámetro specialty filtra mecánicos por especialidad y se usa al
   * asignar un mecánico para que el dropdown solo muestre los compatibles.
   */
  list(role?: UserRole, isActive?: boolean, specialty?: string): Observable<User[]> {
    const params: string[] = [];
    if (role) params.push(`role=${role}`);
    if (isActive !== undefined) params.push(`is_active=${isActive}`);
    if (specialty) params.push(`specialty=${encodeURIComponent(specialty)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<User[]>(`${this.apiUrl}${query}`);
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
    return this.http.post<User>(`${this.apiUrl}/mechanics`, data);
  }

  /** Activa o desactiva un usuario (RF-08). */
  toggleStatus(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
