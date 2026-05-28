// =============================================================================
// VehicleService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Persistencia en MockDataStore (localStorage). El cliente solo ve sus propios
// vehiculos (mismo filtro que aplicaba el backend a /vehicles/me).
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Vehicle, VehicleCreate } from '../models/vehicle.model';
import { MockDataStore } from '../mock/mock-data.store';
import { AuthService } from './auth.service';

const NETWORK_DELAY = 80;

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly store = inject(MockDataStore);
  private readonly auth = inject(AuthService);

  /** Lista los vehiculos del cliente autenticado (RF-10). */
  listMyVehicles(): Observable<Vehicle[]> {
    const me = this.auth.currentUser();
    if (!me) return throwError(() => ({ status: 401 }));
    const mine = this.store.snapshot().vehicles
      .filter((v) => v.owner_id === me.id && v.is_active)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return of(mine).pipe(delay(NETWORK_DELAY));
  }

  /** Lista todos los vehiculos del taller (administrador). */
  listAll(): Observable<Vehicle[]> {
    const all = this.store.snapshot().vehicles
      .filter((v) => v.is_active)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return of(all).pipe(delay(NETWORK_DELAY));
  }

  /** Registra un nuevo vehiculo (RF-09). */
  create(data: VehicleCreate): Observable<Vehicle> {
    const me = this.auth.currentUser();
    if (!me) return throwError(() => ({ status: 401 }));

    const db = this.store.snapshot();
    if (db.vehicles.some((v) => v.license_plate === data.license_plate && v.is_active)) {
      return throwError(() => ({ status: 400, error: { detail: 'La placa ya se encuentra registrada' } }));
    }

    const id = this.store.nextId('vehicle');
    const vehicle: Vehicle = {
      id,
      owner_id: me.id,
      license_plate: data.license_plate,
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      color: data.color ?? null,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.store.mutate((d) => { d.vehicles.push(vehicle); });
    return of(vehicle).pipe(delay(NETWORK_DELAY));
  }

  /** Actualiza los datos del vehiculo (RF-11). */
  update(id: number, data: Partial<VehicleCreate>): Observable<Vehicle> {
    let updated: Vehicle | undefined;
    let error: any = null;
    this.store.mutate((d) => {
      const v = d.vehicles.find((x) => x.id === id);
      if (!v) { error = { status: 404 }; return; }
      if (data.mileage !== undefined && data.mileage < v.mileage) {
        error = { status: 400, error: { detail: 'El kilometraje no puede ser menor al ultimo registrado' } };
        return;
      }
      Object.assign(v, data);
      updated = v;
    });
    if (error) return throwError(() => error);
    return of(updated!).pipe(delay(NETWORK_DELAY));
  }

  /** Elimina (desactiva) un vehiculo (RF-12). */
  remove(id: number): Observable<Vehicle> {
    let updated: Vehicle | undefined;
    this.store.mutate((d) => {
      const v = d.vehicles.find((x) => x.id === id);
      if (!v) return;
      v.is_active = false;
      updated = v;
    });
    if (!updated) return throwError(() => ({ status: 404 }));
    return of(updated).pipe(delay(NETWORK_DELAY));
  }
}
