// =============================================================================
// ServiceCatalogService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// CRUD del catalogo de servicios usando MockDataStore.
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Service, ServiceCreate } from '../models/service.model';
import { MockDataStore } from '../mock/mock-data.store';

const NETWORK_DELAY = 80;

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private readonly store = inject(MockDataStore);

  /** Lista el catalogo de servicios (RF-15). */
  list(onlyActive = true): Observable<Service[]> {
    let services = [...this.store.snapshot().services];
    if (onlyActive) services = services.filter((s) => s.is_active);
    services.sort((a, b) => a.name.localeCompare(b.name));
    return of(services).pipe(delay(NETWORK_DELAY));
  }

  /** Catalogo publico para la pantalla de bienvenida (sin autenticacion). */
  listPublic(): Observable<Service[]> {
    return this.list(true);
  }

  /** Crea un nuevo servicio (RF-13). */
  create(data: ServiceCreate): Observable<Service> {
    const id = this.store.nextId('service');
    const service: Service = {
      id,
      name: data.name,
      description: data.description ?? null,
      category: data.category ?? null,
      duration_minutes: data.duration_minutes,
      price: data.price,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.store.mutate((d) => { d.services.push(service); });
    return of(service).pipe(delay(NETWORK_DELAY));
  }

  /** Actualiza un servicio existente (RF-14). */
  update(id: number, data: Partial<ServiceCreate>): Observable<Service> {
    let updated: Service | undefined;
    this.store.mutate((d) => {
      const s = d.services.find((x) => x.id === id);
      if (!s) return;
      Object.assign(s, data);
      updated = s;
    });
    if (!updated) return throwError(() => ({ status: 404 }));
    return of(updated).pipe(delay(NETWORK_DELAY));
  }

  /** Habilita o deshabilita un servicio (RF-16). */
  toggleStatus(id: number): Observable<Service> {
    let updated: Service | undefined;
    this.store.mutate((d) => {
      const s = d.services.find((x) => x.id === id);
      if (!s) return;
      s.is_active = !s.is_active;
      updated = s;
    });
    if (!updated) return throwError(() => ({ status: 404 }));
    return of(updated).pipe(delay(NETWORK_DELAY));
  }
}
