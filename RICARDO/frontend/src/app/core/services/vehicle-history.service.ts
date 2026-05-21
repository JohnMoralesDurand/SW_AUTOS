// Servicio Angular para consumir el API de historial vehicular (RF-35, RF-36)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

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
  private readonly apiUrl = `${environment.apiUrl}/vehicle-history`;

  constructor(private http: HttpClient) {}

  getHistory(vehicleId: number): Observable<VehicleHistory> {
    return this.http.get<VehicleHistory>(`${this.apiUrl}/${vehicleId}`);
  }

  getMaintenanceSuggestions(vehicleId: number): Observable<MaintenanceSuggestions> {
    return this.http.get<MaintenanceSuggestions>(
      `${this.apiUrl}/${vehicleId}/maintenance-suggestions`,
    );
  }
}
