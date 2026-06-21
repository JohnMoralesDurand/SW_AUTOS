// vehicle.service.ts
// Maneja las llamadas al backend para todo lo que tenga que ver con
// vehiculos: listar, crear, editar y eliminar. El cliente solo ve sus
// propios autos; el admin ve todos.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Vehicle, VehicleCreate } from '../models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly apiUrl = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  /** Lista solo los vehiculos del cliente que esta logueado. */
  listMyVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/me`);
  }

  /** Lista todos los vehiculos del taller (lo usa el admin). */
  listAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.apiUrl);
  }

  /** Registra un vehiculo nuevo (asociado al cliente que esta logueado). */
  create(data: VehicleCreate): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.apiUrl, data);
  }

  /** Actualiza datos del vehiculo (la placa no se puede cambiar). */
  update(id: number, data: Partial<VehicleCreate>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.apiUrl}/${id}`, data);
  }

  /** "Elimina" el vehiculo: en realidad lo marca como inactivo, no se
   *  borra de la base de datos (asi no perdemos el historial de citas). */
  remove(id: number): Observable<Vehicle> {
    return this.http.delete<Vehicle>(`${this.apiUrl}/${id}`);
  }
}
