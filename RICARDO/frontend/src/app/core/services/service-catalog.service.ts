// service-catalog.service.ts
// Maneja el catalogo de servicios del taller (cambio de aceite, frenos,
// etc). El admin puede crear, editar y activar/desactivar; el cliente
// solo lista los activos para reservar una cita.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Service, ServiceCreate } from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  /** Lista los servicios. Por defecto solo los activos; el admin manda
   *  onlyActive=false para ver tambien los desactivados y poder reactivarlos. */
  list(onlyActive = true): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}?only_active=${onlyActive}`);
  }

  /** Mismo catalogo pero sin pedir login (lo usa la pagina de bienvenida). */
  listPublic(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/public`);
  }

  /** Crea un servicio nuevo en el catalogo (solo admin). */
  create(data: ServiceCreate): Observable<Service> {
    return this.http.post<Service>(this.apiUrl, data);
  }

  /** Edita un servicio existente. */
  update(id: number, data: Partial<ServiceCreate>): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/${id}`, data);
  }

  /** Activa o desactiva un servicio (no se borra). */
  toggleStatus(id: number): Observable<Service> {
    return this.http.patch<Service>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
