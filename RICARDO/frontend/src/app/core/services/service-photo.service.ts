// =============================================================================
// ServicePhotoService - Cliente HTTP para fotos de OrdenTrabajo (FotosServicio)
// -----------------------------------------------------------------------------
// Las fotos estan vinculadas a una orden de trabajo: el mecanico las sube
// cuando el auto entra (estado inicial sin daños) y cuando sale (estado final).
// Sirven como evidencia ante reclamos de clientes ("mi auto vino con un rasguño").
//
// Endpoints:
//   - GET    /api/service-photos?work_order_id=X
//   - POST   /api/service-photos/upload  (multipart con file + work_order_id)
//   - DELETE /api/service-photos/{id}
// =============================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ServicePhoto {
  id: number;
  work_order: number;
  url_foto: string;
  descripcion: string | null;
  tipo: string | null;          // 'entrada' | 'salida' | 'general'
  uploaded_by: number | null;
  uploaded_at: string;
  uploaded_by_name?: string | null;
  service_name?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ServicePhotoService {
  private readonly apiUrl = `${environment.apiUrl}/service-photos`;

  // Host base del backend (sin /api) para construir URLs absolutas
  readonly backendHost = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(private http: HttpClient) {}

  /** Lista las fotos de una orden de trabajo. */
  list(workOrderId?: number): Observable<ServicePhoto[]> {
    const url = workOrderId !== undefined
      ? `${this.apiUrl}?work_order_id=${workOrderId}`
      : this.apiUrl;
    return this.http.get<ServicePhoto[]>(url);
  }

  /** Sube una foto a la orden indicada. */
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

  /** Elimina una foto (solo staff). */
  delete(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}`);
  }

  /** Convierte url_foto en URL absoluta (DRF ya la devuelve absoluta, esto es fallback). */
  absoluteUrl(photo: ServicePhoto): string {
    if (!photo.url_foto) return '';
    return photo.url_foto.startsWith('http')
      ? photo.url_foto
      : `${this.backendHost}${photo.url_foto}`;
  }
}
