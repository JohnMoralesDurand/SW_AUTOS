// ApiService.
// Misma estructura del ApiService que vimos en clase (DESARROLLO_WEB_2.0):
//   - @Injectable con providedIn:'root'
//   - private apiUrl con la URL del backend Django
//   - constructor(private cliente: HttpClient)
//   - metodos listarX / crearX / actualizarX / eliminarX que devuelven Observable<T>
//
// Aca uno en una sola clase las llamadas a todas las entidades principales
// del taller (usuarios, vehiculos, servicios, citas, ordenes de trabajo).
// El proyecto en su version final tiene los services separados por entidad
// dentro de src/app/core/services/ (mejor organizacion al ser mas grande)
// pero el patron interno es exactamente este.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { usuario } from '../model/usuario.model';
import { vehiculo } from '../model/vehiculo.model';
import { servicio } from '../model/servicio.model';
import { cita } from '../model/cita.model';
import { ordentrabajo } from '../model/ordentrabajo.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // URL del backend Django (puerto 8001, igual que tiene environment.ts)
  private apiUrl = 'http://127.0.0.1:8001/api/';

  constructor(private cliente: HttpClient) { }

  // ---------- Usuarios ----------
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

  // ---------- Vehiculos ----------
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

  // ---------- Servicios del catalogo ----------
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

  // ---------- Citas ----------
  // Como en el ejemplo de Alumno del profe: al crear mando los *_id de las FK
  // y el backend me devuelve el objeto enriquecido con los nombres.
  listarCitas(): Observable<cita[]> {
    return this.cliente.get<cita[]>(this.apiUrl + 'appointments');
  }

  crearCita(nueva: any): Observable<cita> {
    // nueva trae vehicle_id, service_id, scheduled_at (igual al payload del
    // alumnocreacion del profe con tipo_documento_id)
    return this.cliente.post<cita>(this.apiUrl + 'appointments', nueva);
  }

  actualizarCita(c: cita): Observable<cita> {
    return this.cliente.put<cita>(this.apiUrl + 'appointments/' + c.id, c);
  }

  eliminarCita(c: cita): Observable<void> {
    return this.cliente.delete<void>(this.apiUrl + 'appointments/' + c.id);
  }

  // ---------- Ordenes de Trabajo ----------
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
