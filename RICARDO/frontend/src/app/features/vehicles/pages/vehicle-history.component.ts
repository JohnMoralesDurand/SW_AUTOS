// vehicle-history.component.ts
// Es la pantalla "Historial del vehiculo". Muestra:
//   - Datos del auto (placa, marca, modelo, kilometraje).
//   - Lista de todos los servicios completados que se le hicieron.
//   - Sugerencias de mantenimiento que se generan en el backend segun
//     el kilometraje actual y cuanto tiempo paso desde el ultimo servicio.
// El id del auto viene en la URL (ej: /app/vehicles/3/history).
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Car,
  History,
  Lightbulb,
} from 'lucide-angular';

import {
  VehicleHistory,
  VehicleHistoryService,
  MaintenanceSuggestions,
} from '../../../core/services/vehicle-history.service';

@Component({
  selector: 'app-vehicle-history',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './vehicle-history.component.html',
})
export class VehicleHistoryComponent implements OnInit {
  readonly arrowIcon = ArrowLeft;
  readonly carIcon = Car;
  readonly historyIcon = History;
  readonly bulbIcon = Lightbulb;

  readonly history = signal<VehicleHistory | null>(null);
  readonly suggestions = signal<MaintenanceSuggestions | null>(null);
  readonly loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private historyService: VehicleHistoryService,
  ) {}

  /** Cuando se carga la pantalla, agarro el id de la URL y pido al
   *  backend el historial y las sugerencias en paralelo. */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.historyService.getHistory(id).subscribe({
      next: (data) => {
        this.history.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.historyService.getMaintenanceSuggestions(id).subscribe({
      next: (data) => this.suggestions.set(data),
    });
  }

  /** Suma cuanto gasto en total el cliente en este auto. */
  totalSpent(): number {
    return (this.history()?.history ?? []).reduce((acc, h) => acc + h.amount, 0);
  }
}
