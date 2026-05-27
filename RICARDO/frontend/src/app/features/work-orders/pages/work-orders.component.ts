// =============================================================================
// Componente "Órdenes de Trabajo" (RF-24 a RF-27)
// -----------------------------------------------------------------------------
// Permite al admin / mecánico:
//   - Listar todas las órdenes de trabajo del taller.
//   - Editar el diagnóstico (RF-25).
//   - Agregar repuestos / cargos a la orden (RF-26).
//   - Cerrar la orden (RN-13: requiere diagnóstico + al menos un ítem).
//
// Las órdenes se crean automáticamente cuando una cita pasa a "en atención".
// =============================================================================
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  ClipboardList,
  Plus,
  X,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-angular';

// PrimeNG (referencia: profesor en DESARROLLO_WEB_2.0)
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import {
  WorkOrder,
  WorkOrderService,
} from '../../../core/services/work-order.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-work-orders',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule,
    // Modulos PrimeNG
    ButtonModule, TagModule,
  ],
  templateUrl: './work-orders.component.html',
})
export class WorkOrdersComponent implements OnInit {
  readonly clipboardIcon = ClipboardList;
  readonly plusIcon = Plus;
  readonly closeIcon = X;
  readonly saveIcon = Save;
  readonly checkIcon = CheckCircle;
  readonly alertIcon = AlertCircle;

  readonly orders = signal<WorkOrder[]>([]);
  readonly statusFilter = signal<'all' | 'open' | 'closed'>('all');

  // Estado de edición de la orden expandida.
  readonly expandedId = signal<number | null>(null);
  readonly diagnosisDraft = signal<string>('');
  readonly savingDiagnosis = signal(false);
  readonly closingOrder = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Formulario para agregar items.
  readonly itemForm = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(2)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unit_price: [0, [Validators.required, Validators.min(0)]],
  });
  readonly addingItem = signal(false);

  constructor(
    private fb: FormBuilder,
    private workOrderService: WorkOrderService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.workOrderService.list().subscribe({
      next: (data) => this.orders.set(data),
    });
  }

  filteredOrders(): WorkOrder[] {
    const f = this.statusFilter();
    if (f === 'all') return this.orders();
    return this.orders().filter((o) => o.status === f);
  }

  setFilter(value: 'all' | 'open' | 'closed'): void {
    this.statusFilter.set(value);
  }

  toggleExpanded(order: WorkOrder): void {
    if (this.expandedId() === order.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(order.id);
    this.diagnosisDraft.set(order.diagnosis ?? '');
    this.errorMessage.set(null);
    this.itemForm.reset({ description: '', quantity: 1, unit_price: 0 });
  }

  saveDiagnosis(order: WorkOrder): void {
    this.savingDiagnosis.set(true);
    this.errorMessage.set(null);
    this.workOrderService
      .updateDiagnosis(order.id, this.diagnosisDraft())
      .subscribe({
        next: () => {
          this.savingDiagnosis.set(false);
          this.load();
        },
        error: (err) => {
          this.savingDiagnosis.set(false);
          this.errorMessage.set(
            extractErrorMessage(err, 'No se pudo guardar el diagnóstico.'),
          );
        },
      });
  }

  addItem(order: WorkOrder): void {
    this.itemForm.markAllAsTouched();
    if (this.itemForm.invalid) return;
    this.addingItem.set(true);
    this.errorMessage.set(null);
    this.workOrderService.addItem(order.id, this.itemForm.getRawValue()).subscribe({
      next: () => {
        this.addingItem.set(false);
        this.itemForm.reset({ description: '', quantity: 1, unit_price: 0 });
        this.load();
      },
      error: (err) => {
        this.addingItem.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'No se pudo agregar el ítem.'),
        );
      },
    });
  }

  closeOrder(order: WorkOrder): void {
    if (!confirm('¿Cerrar definitivamente la orden? Marcará la cita como completada.')) return;
    this.closingOrder.set(true);
    this.errorMessage.set(null);
    this.workOrderService.close(order.id).subscribe({
      next: () => {
        this.closingOrder.set(false);
        this.expandedId.set(null);
        this.load();
      },
      error: (err) => {
        this.closingOrder.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'No se pudo cerrar la orden.'),
        );
      },
    });
  }

  itemTotal(item: { quantity: number; unit_price: number }): number {
    return item.quantity * item.unit_price;
  }
}
