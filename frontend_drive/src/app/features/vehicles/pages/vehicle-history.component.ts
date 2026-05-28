// =============================================================================
// Componente "Historial Vehicular" (RF-35, RF-36)
// -----------------------------------------------------------------------------
// Muestra todos los servicios completados de un vehículo y sugiere
// mantenimientos preventivos según kilometraje y tiempo transcurrido.
// =============================================================================
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

  totalSpent(): number {
    return (this.history()?.history ?? []).reduce((acc, h) => acc + h.amount, 0);
  }
}
