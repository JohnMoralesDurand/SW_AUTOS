// work-orders.component.ts
// Pantalla de "Ordenes de trabajo". Aca el mecanico (o el admin) puede:
//   - Ver la lista de todas las ordenes del taller.
//   - Expandir una para ver el detalle.
//   - Escribir o editar el diagnostico.
//   - Agregar repuestos o cargos a la orden (el total se recalcula solo).
//   - Subir fotos del auto (entrada / salida) como evidencia.
//   - Cerrar la orden cuando termina el trabajo.
//
// Para cerrar la orden el backend exige que tenga diagnostico y al
// menos un item; si no, devuelve error y se muestra en la pantalla.
// Las ordenes se crean automaticamente cuando una cita pasa al estado
// "en atencion", asi que aca solo se trabajan, no se crean.
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

// PrimeNG: botones, tag de estado, dialogo de confirmacion, toasts y el
// componente p-fileupload para elegir la foto del auto.
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmationService, MessageService } from 'primeng/api';

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
    ButtonModule, TagModule, ConfirmDialogModule, ToastModule, FileUploadModule,
  ],
  templateUrl: './work-orders.component.html',
  providers: [ConfirmationService, MessageService],
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
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
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
          this.messageService.add({
            severity: 'info',
            summary: 'Confirmación',
            detail: 'El diagnóstico se ha guardado correctamente',
          });
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
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmación',
          detail: 'El ítem se ha agregado correctamente',
        });
      },
      error: (err) => {
        this.addingItem.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'No se pudo agregar el ítem.'),
        );
      },
    });
  }

  /** Cierra la orden definitivamente. Como es una accion sin vuelta atras
   *  (marca la cita como completada y avisa al cliente), primero pide
   *  confirmacion con el dialogo de PrimeNG. */
  closeOrder(order: WorkOrder): void {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea cerrar la orden? Marcará la cita como completada y se notificará al cliente.',
      header: 'Confirmar cierre de orden',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cerrar orden',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.closingOrder.set(true);
        this.errorMessage.set(null);
        this.workOrderService.close(order.id).subscribe({
          next: () => {
            this.closingOrder.set(false);
            this.expandedId.set(null);
            this.load();
            this.messageService.add({
              severity: 'info',
              summary: 'Confirmación',
              detail: 'La orden se ha cerrado correctamente',
            });
          },
          error: (err) => {
            this.closingOrder.set(false);
            this.errorMessage.set(
              extractErrorMessage(err, 'No se pudo cerrar la orden.'),
            );
          },
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancelado',
          detail: 'La orden sigue abierta',
          life: 3000,
        });
      },
    });
  }

  itemTotal(item: { quantity: number; unit_price: number }): number {
    return item.quantity * item.unit_price;
  }

  // ===========================================================================
  // Manejo de fotos de la orden (entrada/salida del auto)
  // ===========================================================================

  /** Se dispara cuando el p-fileupload de PrimeNG elige un archivo.
   *  Aca NO se sube todavia: solo guardo el archivo y muestro la vista
   *  previa. La subida real ocurre al apretar "Subir foto" (asi el
   *  mecanico primero puede elegir el tipo entrada/salida y la
   *  descripcion). El fileUpload.clear() es para poder volver a elegir
   *  el mismo archivo si se arrepiente. */
  onPhotoChosen(event: { files: File[] }, fileUpload: { clear: () => void }): void {
    const file = event.files?.[0] ?? null;
    fileUpload.clear();
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
          this.messageService.add({
            severity: 'info',
            summary: 'Confirmación',
            detail: 'La foto se ha subido correctamente',
          });
        },
        error: (err) => {
          this.uploadingPhoto.set(false);
          this.photoError.set(
            extractErrorMessage(err, 'No se pudo subir la foto.'),
          );
        },
      });
  }

  /** Borra una foto de la orden, con confirmacion previa. */
  deletePhoto(photo: { id: number }): void {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar esta foto?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.photoService.delete(photo.id).subscribe({
          next: () => {
            this.load();
            this.messageService.add({
              severity: 'info',
              summary: 'Confirmación',
              detail: 'La foto se ha eliminado correctamente',
            });
          },
          error: (err) => {
            this.photoError.set(
              extractErrorMessage(err, 'No se pudo eliminar la foto.'),
            );
          },
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancelado',
          detail: 'La foto no se ha eliminado',
          life: 3000,
        });
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
