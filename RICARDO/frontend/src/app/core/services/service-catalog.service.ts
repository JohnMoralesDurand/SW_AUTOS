// Servicio para interactuar con el API del catalogo de servicios
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Service, ServiceCreate } from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  /** Lista el catalogo de servicios (RF-15). */
  list(onlyActive = true): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}?only_active=${onlyActive}`);
  }

  /** Catalogo publico para la pantalla de bienvenida (sin autenticacion). */
  listPublic(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/public`);
  }

  /** Crea un nuevo servicio (RF-13). */
  create(data: ServiceCreate): Observable<Service> {
    return this.http.post<Service>(this.apiUrl, data);
  }

  /** Actualiza un servicio existente (RF-14). */
  update(id: number, data: Partial<ServiceCreate>): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/${id}`, data);
  }

  /** Habilita o deshabilita un servicio (RF-16). */
  toggleStatus(id: number): Observable<Service> {
    return this.http.patch<Service>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
