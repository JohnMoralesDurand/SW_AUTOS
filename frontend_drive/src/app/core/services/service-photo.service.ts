// =============================================================================
// ServicePhotoService (version mock para entrega sin backend)
// -----------------------------------------------------------------------------
// Permite al mecanico subir fotos del auto (entrada/salida) como evidencia.
// La foto se guarda como Data URL (base64) dentro del propio localStorage,
// asi no se necesita un servidor que la sirva.
//
// Cuidado con el tamano: localStorage tiene un limite ~5MB por origen, asi
// que limitamos a 2 MB por imagen y mostramos error si se excede.
// =============================================================================
import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';

import { MockDataStore } from '../mock/mock-data.store';
import { AuthService } from './auth.service';

const NETWORK_DELAY = 100;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

export interface ServicePhoto {
  id: number;
  work_order: number;
  url_foto: string;             // data:image/png;base64,...
  descripcion: string | null;
  tipo: string | null;          // 'entrada' | 'salida' | 'general'
  uploaded_by: number | null;
  uploaded_at: string;
  uploaded_by_name?: string | null;
  service_name?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ServicePhotoService {
  // Compatibilidad con el codigo que importa backendHost (ahora vacio).
  readonly backendHost = '';

  private readonly store = inject(MockDataStore);
  private readonly auth = inject(AuthService);

  /** Lista las fotos de una orden de trabajo. */
  list(workOrderId?: number): Observable<ServicePhoto[]> {
    const db = this.store.snapshot();
    let photos = [...db.photos];
    if (workOrderId !== undefined) photos = photos.filter((p) => p.work_order === workOrderId);
    photos.sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
    return of(photos).pipe(delay(NETWORK_DELAY));
  }

  /** Sube una foto a la orden indicada (la convierte a base64 antes de guardar). */
  upload(
    workOrderId: number,
    file: File,
    tipo?: 'entrada' | 'salida' | 'general',
    descripcion?: string,
  ): Observable<ServicePhoto> {
    if (file.size > MAX_PHOTO_BYTES) {
      return throwError(() => ({
        status: 400,
        error: { detail: `La imagen excede el limite de ${MAX_PHOTO_BYTES / 1024 / 1024} MB.` },
      }));
    }
    return from(this.fileToDataUrl(file)).pipe(
      mergeMap((dataUrl) => {
        const me = this.auth.currentUser();
        const id = this.store.nextId('photo');
        const photo: ServicePhoto = {
          id,
          work_order: workOrderId,
          url_foto: dataUrl,
          descripcion: descripcion ?? null,
          tipo: tipo ?? 'general',
          uploaded_by: me?.id ?? null,
          uploaded_at: new Date().toISOString(),
          uploaded_by_name: me ? `${me.first_name} ${me.last_name}` : null,
          service_name: null,
        };
        this.store.mutate((d) => { d.photos.push(photo); });
        return of(photo).pipe(delay(NETWORK_DELAY));
      }),
    );
  }

  /** Elimina una foto (solo staff). */
  delete(photoId: number): Observable<void> {
    this.store.mutate((d) => {
      d.photos = d.photos.filter((p) => p.id !== photoId);
    });
    return of(void 0).pipe(delay(NETWORK_DELAY));
  }

  /** Compatibilidad: las fotos mock ya son data URLs absolutas, asi que basta con devolverlas. */
  absoluteUrl(photo: ServicePhoto): string {
    return photo.url_foto || '';
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
