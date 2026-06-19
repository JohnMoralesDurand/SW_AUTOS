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
  Camera,
  Upload,
  Trash2,
} from 'lucide-angular';

// PrimeNG para los botones y el tag de estado de la orden
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import {
  WorkOrder,
  WorkOrderService,
} from '../../../core/services/work-order.service';
import {
  ServicePhoto,
  ServicePhotoService,
} from '../../../core/services/service-photo.service';
import { AuthService } from '../../../core/services/auth.service';
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
  readonly cameraIcon = Camera;
  readonly uploadIcon = Upload;
  readonly trashIcon = Trash2;

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

  // ---- Estado para fotos de la orden (entrada / salida) ----
  readonly selectedFile = signal<File | null>(null);
  readonly selectedPreview = signal<string | null>(null);
  readonly uploadTipo = signal<'entrada' | 'salida' | 'general'>('entrada');
  readonly uploadDescripcion = signal<string>('');
  readonly uploadingPhoto = signal(false);
  readonly photoError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private workOrderService: WorkOrderService,
    public authService: AuthService,
    public photoService: ServicePhotoService,
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

  // ===========================================================================
  // Manejo de fotos de la orden (entrada/salida del auto)
  // ===========================================================================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.photoError.set('El archivo seleccionado no es una imagen.');
      return;
    }
    if (this.selectedPreview()) {
      URL.revokeObjectURL(this.selectedPreview()!);
    }
    this.selectedFile.set(file);
    this.selectedPreview.set(URL.createObjectURL(file));
    this.photoError.set(null);
  }

  uploadPhoto(order: WorkOrder): void {
    const file = this.selectedFile();
    if (!file) {
      this.photoError.set('Selecciona una imagen antes de subir.');
      return;
    }
    this.uploadingPhoto.set(true);
    this.photoError.set(null);
    this.photoService
      .upload(order.id, file, this.uploadTipo(), this.uploadDescripcion() || undefined)
      .subscribe({
        next: () => {
          this.uploadingPhoto.set(false);
          if (this.selectedPreview()) {
            URL.revokeObjectURL(this.selectedPreview()!);
          }
          this.selectedFile.set(null);
          this.selectedPreview.set(null);
          this.uploadDescripcion.set('');
          // Recarga la lista para refrescar las fotos
          this.load();
        },
        error: (err) => {
          this.uploadingPhoto.set(false);
          this.photoError.set(
            extractErrorMessage(err, 'No se pudo subir la foto.'),
          );
        },
      });
  }

  deletePhoto(photo: { id: number }): void {
    if (!confirm('¿Eliminar esta foto?')) return;
    this.photoService.delete(photo.id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.photoError.set(
          extractErrorMessage(err, 'No se pudo eliminar la foto.'),
        );
      },
    });
  }

  tipoLabel(tipo: string | null | undefined): string {
    switch ((tipo || '').toLowerCase()) {
      case 'entrada': return 'Entrada';
      case 'salida':  return 'Salida';
      default:        return 'General';
    }
  }

  tipoSeverity(
    tipo: string | null | undefined,
  ): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    switch ((tipo || '').toLowerCase()) {
      case 'entrada': return 'info';
      case 'salida':  return 'success';
      default:        return 'secondary';
    }
  }
}
