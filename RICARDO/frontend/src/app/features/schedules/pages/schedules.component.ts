// Componente "Horarios".
// Solo el admin puede modificar el horario del taller. Cambia el dia
// (abierto/cerrado) y la hora de apertura/cierre. El cambio afecta la
// validacion de slots de las citas inmediatamente.
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Clock,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-angular';

// PrimeNG: tabla con los 7 dias, botones de guardar e inputs de hora
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TagModule } from 'primeng/tag';

import {
  BusinessHours,
  ScheduleService,
} from '../../../core/services/schedule.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucideAngularModule,
    TableModule, ButtonModule, InputTextModule, InputSwitchModule, TagModule,
  ],
  templateUrl: './schedules.component.html',
})
export class SchedulesComponent implements OnInit {
  readonly clockIcon = Clock;
  readonly saveIcon = Save;
  readonly alertIcon = AlertCircle;
  readonly checkIcon = CheckCircle;

  readonly schedule = signal<BusinessHours[]>([]);
  readonly savingDay = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly dayLabels = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ];

  constructor(private scheduleService: ScheduleService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.scheduleService.list().subscribe({
      next: (data) => this.schedule.set(data),
    });
  }

  /** Guarda la configuración de un día específico. */
  saveDay(day: BusinessHours): void {
    this.savingDay.set(day.day_of_week);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.scheduleService
      .update(day.day_of_week, {
        is_open: day.is_open,
        open_time: day.open_time,
        close_time: day.close_time,
      })
      .subscribe({
        next: () => {
          this.savingDay.set(null);
          this.successMessage.set(
            `Horario de ${this.dayLabels[day.day_of_week]} guardado.`,
          );
          setTimeout(() => this.successMessage.set(null), 2500);
        },
        error: (err) => {
          this.savingDay.set(null);
          this.errorMessage.set(
            extractErrorMessage(err, 'No se pudo guardar el horario.'),
          );
        },
      });
  }
}
