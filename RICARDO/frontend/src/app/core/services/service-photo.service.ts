// service-photo.service.ts
// Maneja la subida y listado de fotos que el mecanico le saca al auto.
// La idea es tener evidencia: al recibir el vehiculo se toma una foto
// ("entrada") y al entregarlo otra ("salida"). Asi si el cliente reclama
// despues un rasguño, hay como demostrar el estado en el que llego.
// Cada foto esta asociada a una orden de trabajo.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ServicePhoto {
  id: number;
  work_order: number;             // id de la orden a la que pertenece
  url_foto: string;               // URL donde esta guardada la imagen
  descripcion: string | null;
  tipo: string | null;            // 'entrada' / 'salida' / 'general'
  uploaded_by: number | null;     // id del mecanico que la subio
  uploaded_at: string;
  uploaded_by_name?: string | null;
  service_name?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ServicePhotoService {
  private readonly apiUrl = `${environment.apiUrl}/service-photos`;

  // Direccion del backend sin "/api" al final. Lo uso para construir
  // URLs completas de las fotos cuando el backend devuelve una ruta corta.
  readonly backendHost = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(private http: HttpClient) {}

  /** Trae las fotos de una orden de trabajo. */
  list(workOrderId?: number): Observable<ServicePhoto[]> {
    const url = workOrderId !== undefined
      ? `${this.apiUrl}?work_order_id=${workOrderId}`
      : this.apiUrl;
    return this.http.get<ServicePhoto[]>(url);
  }

  /** Sube una foto al backend. Uso FormData porque tengo que mandar el
   *  archivo binario (multipart/form-data), no JSON. */
  upload(
    workOrderId: number,
    file: File,
    tipo?: 'entrada' | 'salida' | 'general',
    descripcion?: string,
  ): Observable<ServicePhoto> {
    const form = new FormData();
    form.append('work_order_id', String(workOrderId));
    form.append('file', file);
    if (tipo) form.append('tipo', tipo);
    if (descripcion) form.append('descripcion', descripcion);
    return this.http.post<ServicePhoto>(`${this.apiUrl}/upload`, form);
  }

  /** Borra una foto (solo el mecanico o el admin). */
  delete(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}`);
  }

  /** Si la URL de la foto vino sin el dominio (relativa), le pega el host
   *  del backend para que el <img src="..."> funcione. */
  absoluteUrl(photo: ServicePhoto): string {
    if (!photo.url_foto) return '';
    return photo.url_foto.startsWith('http')
      ? photo.url_foto
      : `${this.backendHost}${photo.url_foto}`;
  }
}
