// =============================================================================
// MockDataStore - Reemplaza al backend Django para la entrega del trabajo
// -----------------------------------------------------------------------------
// La entrega solo permite subir el frontend (sin backend ni base de datos),
// asi que todas las llamadas HTTP fueron reemplazadas por este "store" en
// memoria que persiste en localStorage para que los datos sobrevivan refresh.
//
// Como funciona:
//   - Al arrancar la app por primera vez, carga el JSON semilla desde
//     /assets/mock-data/seed.json (3 usuarios de prueba, 6 servicios, 7 dias).
//   - Despues toda mutacion (insert/update/remove) se guarda en localStorage
//     bajo la clave LS_KEY para que la siguiente recarga vea los cambios.
//   - Los services del proyecto siguen devolviendo Observable<T> (rxjs.of) para
//     que los componentes de Angular no necesiten cambiar nada.
//
// Importante: NO es un mock pensado para produccion. Las contrasenas se
// guardan en texto plano y el "token" es un UUID falso. Sirve exclusivamente
// para demostrar la funcionalidad del frontend al docente.
// =============================================================================
import { Injectable, signal } from '@angular/core';

import type { User } from '../models/user.model';
import type { Vehicle } from '../models/vehicle.model';
import type { Service } from '../models/service.model';
import type { Appointment } from '../models/appointment.model';
import type { WorkOrder, WorkOrderItem } from '../services/work-order.service';
import type { Notification } from '../services/notification.service';
import type { BusinessHours } from '../services/schedule.service';
import type { ServicePhoto } from '../services/service-photo.service';

// Forma del JSON seed (debe coincidir con seed.json)
export interface MockDataSnapshot {
  users: User[];
  passwords: Record<string, string>;   // user_id -> password (mock)
  services: Service[];
  vehicles: Vehicle[];
  appointments: Appointment[];
  workOrders: WorkOrder[];
  workOrderItems: WorkOrderItem[];
  notifications: Notification[];
  photos: ServicePhoto[];
  schedules: BusinessHours[];
  nextIds: Record<string, number>;
}

// Clave usada en localStorage para persistir el estado
const LS_KEY = 'autoserv_mock_db';

// Importacion estatica del seed: webpack lo embebe en el bundle, asi no hace falta HTTP.
// (La extension typescript-json se habilita en tsconfig con resolveJsonModule: true)
import seedJson from '../../../assets/mock-data/seed.json';

@Injectable({ providedIn: 'root' })
export class MockDataStore {
  // Signal interno con la "tabla" completa. Se podria exponer si algun componente
  // quiere reaccionar a cambios sin volver a llamar al service.
  private readonly state = signal<MockDataSnapshot>(this.loadOrSeed());

  /** Devuelve el snapshot actual (solo lectura). */
  snapshot(): MockDataSnapshot {
    return this.state();
  }

  /** Aplica un cambio al estado y persiste a localStorage. */
  mutate(updater: (draft: MockDataSnapshot) => void): void {
    const next: MockDataSnapshot = JSON.parse(JSON.stringify(this.state()));
    updater(next);
    this.state.set(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  /** Genera un id consecutivo para la entidad indicada (user, vehicle, etc.). */
  nextId(entity: keyof MockDataSnapshot['nextIds']): number {
    const current = this.state().nextIds[entity] || 1;
    this.mutate((d) => { d.nextIds[entity] = current + 1; });
    return current;
  }

  /** Borra todo el storage y vuelve al seed (util en consola: window.localStorage.clear()). */
  reset(): void {
    localStorage.removeItem(LS_KEY);
    this.state.set(this.cloneSeed());
  }

  // =========================================================================
  // Helpers privados
  // =========================================================================
  private loadOrSeed(): MockDataSnapshot {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as MockDataSnapshot;
      } catch {
        // localStorage corrupto: caemos al seed
      }
    }
    const fresh = this.cloneSeed();
    localStorage.setItem(LS_KEY, JSON.stringify(fresh));
    return fresh;
  }

  private cloneSeed(): MockDataSnapshot {
    // El seed se importa como modulo, asi que clonamos para no mutar la referencia.
    return JSON.parse(JSON.stringify(seedJson)) as MockDataSnapshot;
  }
}
