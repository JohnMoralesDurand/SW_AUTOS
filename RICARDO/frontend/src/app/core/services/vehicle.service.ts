// Servicio para interactuar con el API de vehiculos
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Vehicle, VehicleCreate } from '../models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly apiUrl = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  /** Lista los vehiculos del cliente autenticado (RF-10). */
  listMyVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/me`);
  }

  /** Lista todos los vehiculos del taller (administrador). */
  listAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.apiUrl);
  }

  /** Registra un nuevo vehiculo (RF-09). */
  create(data: VehicleCreate): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.apiUrl, data);
  }

  /** Actualiza los datos del vehiculo (RF-11). */
  update(id: number, data: Partial<VehicleCreate>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.apiUrl}/${id}`, data);
  }

  /** Elimina (desactiva) un vehiculo (RF-12). */
  remove(id: number): Observable<Vehicle> {
    return this.http.delete<Vehicle>(`${this.apiUrl}/${id}`);
  }
}
