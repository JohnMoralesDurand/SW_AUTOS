// vehicle-history.service.ts
// Trae dos cosas para un vehiculo:
//   1) El historial completo de servicios que se le hicieron (fechas,
//      precios, mecanico que atendio).
//   2) Sugerencias de mantenimiento preventivo basadas en su kilometraje
//      y cuanto tiempo paso desde el ultimo servicio.
// Lo usa la pantalla de "Historial del vehiculo".
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// Una entrada del historial = un servicio que se le hizo al auto
export interface VehicleHistoryItem {
  appointment_id: number;
  service: string | null;
  date: string;
  amount: number;            // cuanto se cobro en ese servicio
  mechanic: string | null;
}

// Lo que devuelve el endpoint principal: datos del auto + lista de servicios
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

// Sugerencias automaticas basadas en el estado actual del auto
export interface MaintenanceSuggestions {
  vehicle_id: number;
  suggestions: string[];     // ej: ["Revision general", "Cambio de aceite"]
}

@Injectable({ providedIn: 'root' })
export class VehicleHistoryService {
  private readonly apiUrl = `${environment.apiUrl}/vehicle-history`;

  constructor(private http: HttpClient) {}

  /** Trae el historial de servicios de un auto. */
  getHistory(vehicleId: number): Observable<VehicleHistory> {
    return this.http.get<VehicleHistory>(`${this.apiUrl}/${vehicleId}`);
  }

  /** Trae las sugerencias de mantenimiento preventivo. */
  getMaintenanceSuggestions(vehicleId: number): Observable<MaintenanceSuggestions> {
    return this.http.get<MaintenanceSuggestions>(
      `${this.apiUrl}/${vehicleId}/maintenance-suggestions`,
    );
  }
}
