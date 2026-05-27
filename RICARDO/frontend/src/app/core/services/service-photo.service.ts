// =============================================================================
// ServicePhotoService - Cliente HTTP para fotos de servicio (FotosServicio)
// -----------------------------------------------------------------------------
// Encapsula las llamadas al backend para:
//   - Subir una foto (multipart/form-data con un archivo binario).
//   - Listar las fotos de un servicio.
//   - Eliminar una foto.
//
// Las fotos se sirven desde el backend en /uploads/service_photos/<archivo>.
// La URL completa para visualizarlas se construye con el HOST del API.
// =============================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ServicePhoto {
  id: number;
  service_id: number;
  url_foto: string;
  descripcion: string | null;
  tipo: string | null;          // 'entrada' | 'salida' | 'general'
  uploaded_by_id: number | null;
  uploaded_at: string;
  uploaded_by_name?: string | null;
  service_name?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ServicePhotoService {
  private readonly apiUrl = `${environment.apiUrl}/service-photos`;

  // Host base del backend (sin /api). Sirve para componer la URL absoluta de las fotos.
  readonly backendHost = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(private http: HttpClient) {}

  /** Lista las fotos de un servicio especifico (o todas si no se pasa id). */
  list(serviceId?: number): Observable<ServicePhoto[]> {
    const url = serviceId !== undefined
      ? `${this.apiUrl}?service_id=${serviceId}`
      : this.apiUrl;
    return this.http.get<ServicePhoto[]>(url);
  }

  /** Sube una foto al servicio indicado. */
  upload(
    serviceId: number,
    file: File,
    tipo?: 'entrada' | 'salida' | 'general',
    descripcion?: string,
  ): Observable<ServicePhoto> {
    const form = new FormData();
    form.append('service_id', String(serviceId));
    form.append('file', file);
    if (tipo) form.append('tipo', tipo);
    if (descripcion) form.append('descripcion', descripcion);
    return this.http.post<ServicePhoto>(`${this.apiUrl}/upload`, form);
  }

  /** Elimina una foto (admin/mecanico). */
  delete(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}`);
  }

  /** Convierte la URL relativa devuelta por el API en una URL absoluta para el <img>. */
  absoluteUrl(photo: ServicePhoto): string {
    return `${this.backendHost}${photo.url_foto}`;
  }
}
