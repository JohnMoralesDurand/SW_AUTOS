// ApiService unificado.
// Aca centralizo en una sola clase las llamadas al backend para las
// entidades principales del taller (usuarios, vehiculos, servicios, citas
// y ordenes de trabajo). La estructura es la tipica:
//   - @Injectable({ providedIn: 'root' }) -> singleton accesible desde
//     cualquier componente.
//   - private apiUrl -> URL base del backend Django.
//   - constructor(private cliente: HttpClient) -> Angular me inyecta el
//     HttpClient.
//   - metodos listarX / crearX / actualizarX / eliminarX -> CRUD que
//     devuelve Observable<T>.
// En paralelo tengo los services separados por entidad en
// src/app/core/services/ (uno por cada tabla del backend). Esa version
// es la que termina usando la app porque es mas facil de mantener cuando
// hay muchas entidades.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
import { usuario } from '../model/usuario.model';
import { vehiculo } from '../model/vehiculo.model';
import { servicio } from '../model/servicio.model';
import { cita } from '../model/cita.model';
import { ordentrabajo } from '../model/ordentrabajo.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // URL del backend tomada de environment.ts: si el backend cambia de
  // puerto o dominio se corrige en un solo lugar para toda la app
  private apiUrl = environment.apiUrl + '/';

  constructor(private cliente: HttpClient) { }

  // Metodos para usuarios
  listarUsuarios(): Observable<usuario[]> {
    return this.cliente.get<usuario[]>(this.apiUrl + 'users');
  }

  crearUsuario(nuevo: usuario): Observable<usuario> {
    return this.cliente.post<usuario>(this.apiUrl + 'users', nuevo);
  }

  actualizarUsuario(u: usuario): Observable<usuario> {
    return this.cliente.put<usuario>(this.apiUrl + 'users/' + u.id, u);
  }

  eliminarUsuario(u: usuario): Observable<void> {
    return this.cliente.delete<void>(this.apiUrl + 'users/' + u.id);
  }

  // Metodos para vehiculos
  listarVehiculos(): Observable<vehiculo[]> {
    return this.cliente.get<vehiculo[]>(this.apiUrl + 'vehicles');
  }

  crearVehiculo(nuevo: vehiculo): Observable<vehiculo> {
    return this.cliente.post<vehiculo>(this.apiUrl + 'vehicles', nuevo);
  }

  actualizarVehiculo(v: vehiculo): Observable<vehiculo> {
    return this.cliente.put<vehiculo>(this.apiUrl + 'vehicles/' + v.id, v);
  }

  eliminarVehiculo(v: vehiculo): Observable<void> {
    return this.cliente.delete<void>(this.apiUrl + 'vehicles/' + v.id);
  }

  // Metodos para el catalogo de servicios
  listarServicios(): Observable<servicio[]> {
    return this.cliente.get<servicio[]>(this.apiUrl + 'services');
  }

  crearServicio(nuevo: servicio): Observable<servicio> {
    return this.cliente.post<servicio>(this.apiUrl + 'services', nuevo);
  }

  actualizarServicio(s: servicio): Observable<servicio> {
    return this.cliente.put<servicio>(this.apiUrl + 'services/' + s.id, s);
  }

  eliminarServicio(s: servicio): Observable<void> {
    return this.cliente.delete<void>(this.apiUrl + 'services/' + s.id);
  }

  // Metodos para citas
  // Al crear una cita mando los *_id de las FK (vehicle_id, service_id) y
  // el backend me devuelve el objeto enriquecido con los nombres ya
  // resueltos para no tener que ir a buscarlos despues.
  listarCitas(): Observable<cita[]> {
    return this.cliente.get<cita[]>(this.apiUrl + 'appointments');
  }

  crearCita(nueva: any): Observable<cita> {
    // nueva debe traer: vehicle_id, service_id, scheduled_at, notes (opc)
    return this.cliente.post<cita>(this.apiUrl + 'appointments', nueva);
  }

  actualizarCita(c: cita): Observable<cita> {
    return this.cliente.put<cita>(this.apiUrl + 'appointments/' + c.id, c);
  }

  eliminarCita(c: cita): Observable<void> {
    return this.cliente.delete<void>(this.apiUrl + 'appointments/' + c.id);
  }

  // Metodos para ordenes de trabajo
  listarOrdenes(): Observable<ordentrabajo[]> {
    return this.cliente.get<ordentrabajo[]>(this.apiUrl + 'work-orders');
  }

  crearOrden(nueva: ordentrabajo): Observable<ordentrabajo> {
    return this.cliente.post<ordentrabajo>(this.apiUrl + 'work-orders', nueva);
  }

  actualizarOrden(o: ordentrabajo): Observable<ordentrabajo> {
    return this.cliente.put<ordentrabajo>(this.apiUrl + 'work-orders/' + o.id, o);
  }

  eliminarOrden(o: ordentrabajo): Observable<void> {
    return this.cliente.delete<void>(this.apiUrl + 'work-orders/' + o.id);
  }

}
