// Componente "Horarios".
// Solo el admin puede modificar el horario del taller. Cada dia puede
// tener VARIOS bloques de atencion (ej: manana 08-12 y tarde 14-18 con
// pausa de almuerzo). Desde aca se agregan o quitan bloques y se cambian
// las horas; el cambio afecta las reservas de citas inmediatamente.
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Clock,
  Save,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-angular';

// PrimeNG: tabla con los 7 dias, botones de guardar e inputs de hora
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import {
  BusinessHours,
  ScheduleBlock,
  ScheduleService,
} from '../../../core/services/schedule.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucideAngularModule,
    TableModule, ButtonModule, InputTextModule, InputSwitchModule, TagModule, TooltipModule,
  ],
  templateUrl: './schedules.component.html',
})
export class SchedulesComponent implements OnInit {
  readonly clockIcon = Clock;
  readonly saveIcon = Save;
  readonly alertIcon = AlertCircle;
  readonly checkIcon = CheckCircle;
  readonly plusIcon = Plus;
  readonly trashIcon = Trash2;

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
      next: (data) => {
        // Si un dia abierto viene sin bloques, le pongo uno por defecto
        // para que el admin tenga algo que editar
        for (const day of data) {
          if (!day.bloques || day.bloques.length === 0) {
            day.bloques = [{ open_time: '08:00', close_time: '18:00' }];
          }
        }
        this.schedule.set(data);
      },
    });
  }

  /** Agrega un bloque nuevo al dia (para horario partido manana/tarde). */
  addBlock(day: BusinessHours): void {
    // Propongo un bloque de tarde a continuacion del ultimo que tenga
    const last = day.bloques[day.bloques.length - 1];
    day.bloques.push({
      open_time: last ? last.close_time : '14:00',
      close_time: '18:00',
    });
  }

  /** Quita un bloque del dia (siempre debe quedar al menos uno). */
  removeBlock(day: BusinessHours, index: number): void {
    if (day.bloques.length <= 1) return;
    day.bloques.splice(index, 1);
  }

  /** Guarda la configuracion de un dia con TODOS sus bloques. */
  saveDay(day: BusinessHours): void {
    // Validacion simple: cada bloque debe tener apertura antes del cierre
    for (const b of day.bloques) {
      if (!b.open_time || !b.close_time || b.open_time >= b.close_time) {
        this.errorMessage.set(
          `${this.dayLabels[day.day_of_week]}: cada bloque debe abrir antes de cerrar.`,
        );
        return;
      }
    }

    this.savingDay.set(day.day_of_week);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.scheduleService
      .update(day.day_of_week, {
        is_open: day.is_open,
        bloques: day.bloques.map((b: ScheduleBlock) => ({
          open_time: b.open_time,
          close_time: b.close_time,
        })),
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
