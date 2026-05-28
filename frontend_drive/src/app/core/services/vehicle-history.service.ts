// =============================================================================
// VehicleHistoryService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// RF-35 (historial) y RF-36 (sugerencias de mantenimiento preventivo).
// Lee citas completadas del MockDataStore y genera la informacion derivada.
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MockDataStore } from '../mock/mock-data.store';

const NETWORK_DELAY = 80;

// Constantes que decidian las sugerencias en el backend
const KM_INTERVAL = 5000;
const DAYS_INTERVAL = 180;

export interface VehicleHistoryItem {
  appointment_id: number;
  service: string | null;
  date: string;
  amount: number;
  mechanic: string | null;
}

export interface VehicleHistory {
  vehicle: {
    id: number;
    license_plate: string;
    brand: string;
    model: string;
    mileage: number;
  };
  history: VehicleHistoryItem[];
}

export interface MaintenanceSuggestions {
  vehicle_id: number;
  suggestions: string[];
}

@Injectable({ providedIn: 'root' })
export class VehicleHistoryService {
  private readonly store = inject(MockDataStore);

  getHistory(vehicleId: number): Observable<VehicleHistory> {
    const db = this.store.snapshot();
    const vehicle = db.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return throwError(() => ({ status: 404 }));

    const completed = db.appointments
      .filter((a) => a.vehicle_id === vehicleId && a.status === 'completed')
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
      .map<VehicleHistoryItem>((a) => {
        const service = db.services.find((s) => s.id === a.service_id);
        const mech = a.mechanic_id ? db.users.find((u) => u.id === a.mechanic_id) : null;
        return {
          appointment_id: a.id,
          service: service?.name ?? null,
          date: a.scheduled_at,
          amount: a.frozen_price,
          mechanic: mech ? `${mech.first_name} ${mech.last_name}` : null,
        };
      });

    return of({
      vehicle: {
        id: vehicle.id,
        license_plate: vehicle.license_plate,
        brand: vehicle.brand,
        model: vehicle.model,
        mileage: vehicle.mileage,
      },
      history: completed,
    }).pipe(delay(NETWORK_DELAY));
  }

  getMaintenanceSuggestions(vehicleId: number): Observable<MaintenanceSuggestions> {
    const db = this.store.snapshot();
    const vehicle = db.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return throwError(() => ({ status: 404 }));

    const completed = db.appointments
      .filter((a) => a.vehicle_id === vehicleId && a.status === 'completed')
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

    const suggestions: string[] = [];
    if (completed.length > 0) {
      const last = new Date(completed[0].scheduled_at);
      const daysSince = Math.floor((Date.now() - last.getTime()) / 86400000);
      if (daysSince >= DAYS_INTERVAL) {
        suggestions.push(
          `Han pasado ${daysSince} dias desde el ultimo servicio. ` +
          'Se recomienda una revision general.',
        );
      }
    }
    if (vehicle.mileage >= KM_INTERVAL && vehicle.mileage % KM_INTERVAL < 1000) {
      suggestions.push(
        `Su vehiculo tiene ${vehicle.mileage} km. ` +
        'Considere un cambio de aceite y revision de filtros.',
      );
    }
    if (suggestions.length === 0) {
      suggestions.push('No hay mantenimientos preventivos pendientes por el momento.');
    }

    return of({ vehicle_id: vehicleId, suggestions }).pipe(delay(NETWORK_DELAY));
  }
}
