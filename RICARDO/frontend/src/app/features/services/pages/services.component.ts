// =============================================================================
// Componente del Catálogo de Servicios (RF-11, RF-12, RF-13, RF-14)
// -----------------------------------------------------------------------------
// - Administrador: ve todos los servicios (activos e inactivos), puede crear
//   nuevos, editar existentes y habilitar/deshabilitar (RN-10).
// - Cliente: ve los servicios activos y puede reservarlos directamente con un
//   botón "Reservar" que lo lleva a /app/appointments/new con el servicio
//   preseleccionado.
// - Mecánico: ve los servicios activos (solo informativo).
// =============================================================================
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  Wrench,
  ToggleLeft,
  ToggleRight,
  X,
  Calendar,
  AlertCircle,
  Pencil,
  Camera,
  Upload,
  Trash2,
} from 'lucide-angular';

import { ServiceCatalogService } from '../../../core/services/service-catalog.service';
import { Service } from '../../../core/models/service.model';
import { AuthService } from '../../../core/services/auth.service';
import {
  ServicePhoto,
  ServicePhotoService,
} from '../../../core/services/service-photo.service';
import { extractErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './services.component.html',
})
export class ServicesComponent implements OnInit {
  // Iconos
  readonly plusIcon = Plus;
  readonly wrenchIcon = Wrench;
  readonly toggleOnIcon = ToggleRight;
  readonly toggleOffIcon = ToggleLeft;
  readonly closeIcon = X;
  readonly calendarIcon = Calendar;
  readonly alertIcon = AlertCircle;
  readonly editIcon = Pencil;
  readonly cameraIcon = Camera;
  readonly uploadIcon = Upload;
  readonly trashIcon = Trash2;

  readonly services = signal<Service[]>([]);
  readonly showForm = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Indica el id del servicio que se está editando (null = creando uno nuevo).
  readonly editingId = signal<number | null>(null);

  // -------------------------------------------------------------------------
  // Estado del modal de Fotos de Servicio (FotosServicio)
  // -------------------------------------------------------------------------
  readonly showPhotosModal = signal(false);
  readonly photosForService = signal<Service | null>(null);
  readonly photos = signal<ServicePhoto[]>([]);
  readonly photosLoading = signal(false);
  readonly photosError = signal<string | null>(null);

  // Formulario de subida (archivo + tipo + descripcion opcional)
  readonly selectedFile = signal<File | null>(null);
  readonly selectedPreview = signal<string | null>(null);
  readonly uploadTipo = signal<'entrada' | 'salida' | 'general'>('entrada');
  readonly uploadDescripcion = signal<string>('');
  readonly uploading = signal(false);

  // Formulario reutilizable para crear y editar.
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: [''],
    duration_minutes: [60, [Validators.required, Validators.min(15)]],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  constructor(
    private fb: FormBuilder,
    private serviceCatalog: ServiceCatalogService,
    private router: Router,
    public authService: AuthService,
    public photoService: ServicePhotoService,
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    // Los administradores ven todos los servicios; los demás solo activos.
    const onlyActive = !this.authService.isAdmin();
    this.serviceCatalog.list(onlyActive).subscribe({
      next: (data) => this.services.set(data),
    });
  }

  /** Abre el formulario en modo "crear nuevo". */
  openCreateForm(): void {
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.form.reset({
      name: '',
      description: '',
      category: '',
      duration_minutes: 60,
      price: 0,
    });
    this.showForm.set(true);
  }

  /** Abre el formulario en modo "editar" con los datos del servicio. */
  openEditForm(service: Service): void {
    this.editingId.set(service.id);
    this.errorMessage.set(null);
    this.form.reset({
      name: service.name,
      description: service.description ?? '',
      category: service.category ?? '',
      duration_minutes: service.duration_minutes,
      price: service.price,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
  }

  fieldHasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  fieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['minlength']) return 'Debe tener al menos 2 caracteres.';
    if (ctrl.errors['min']) return `El valor mínimo es ${ctrl.errors['min'].min}.`;
    return 'Valor inválido.';
  }

  /** Crea o actualiza el servicio según el modo del formulario. */
  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage.set('Revise los campos marcados en rojo.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const editing = this.editingId();
    const request$ = editing
      ? this.serviceCatalog.update(editing, this.form.getRawValue())
      : this.serviceCatalog.create(this.form.getRawValue());

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.closeForm();
        this.loadServices();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'No se pudo guardar el servicio.'),
        );
      },
    });
  }

  onToggleStatus(service: Service): void {
    this.serviceCatalog.toggleStatus(service.id).subscribe({
      next: () => this.loadServices(),
    });
  }

  /**
   * Lleva al cliente a la pantalla de reserva con el servicio preseleccionado.
   * Se pasa el id por query param y new-appointment lo lee para autoseleccionarlo.
   */
  bookService(service: Service): void {
    this.router.navigate(['/app/appointments/new'], {
      queryParams: { service_id: service.id },
    });
  }

  // ===========================================================================
  // Gestion de Fotos de Servicio (FotosServicio del diagrama)
  // ===========================================================================

  /** Abre el modal de fotos para un servicio especifico. */
  openPhotosModal(service: Service): void {
    this.photosForService.set(service);
    this.photos.set([]);
    this.photosError.set(null);
    this.selectedFile.set(null);
    this.selectedPreview.set(null);
    this.uploadDescripcion.set('');
    this.uploadTipo.set('entrada');
    this.showPhotosModal.set(true);
    this.loadPhotos(service.id);
  }

  closePhotosModal(): void {
    this.showPhotosModal.set(false);
    this.photosForService.set(null);
    this.photos.set([]);
    if (this.selectedPreview()) {
      URL.revokeObjectURL(this.selectedPreview()!);
    }
    this.selectedFile.set(null);
    this.selectedPreview.set(null);
  }

  /** Carga las fotos del servicio desde el backend. */
  private loadPhotos(serviceId: number): void {
    this.photosLoading.set(true);
    this.photoService.list(serviceId).subscribe({
      next: (data) => {
        this.photos.set(data);
        this.photosLoading.set(false);
      },
      error: (err) => {
        this.photosLoading.set(false);
        this.photosError.set(
          extractErrorMessage(err, 'No se pudieron cargar las fotos.'),
        );
      },
    });
  }

  /** Maneja la seleccion de archivo del input. */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    // Validacion basica de tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.photosError.set('El archivo seleccionado no es una imagen.');
      return;
    }
    // Limpia el preview anterior
    if (this.selectedPreview()) {
      URL.revokeObjectURL(this.selectedPreview()!);
    }
    this.selectedFile.set(file);
    this.selectedPreview.set(URL.createObjectURL(file));
    this.photosError.set(null);
  }

  /** Sube la foto seleccionada al servicio actual. */
  uploadPhoto(): void {
    const service = this.photosForService();
    const file = this.selectedFile();
    if (!service || !file) {
      this.photosError.set('Selecciona una imagen antes de subir.');
      return;
    }
    this.uploading.set(true);
    this.photosError.set(null);

    this.photoService
      .upload(service.id, file, this.uploadTipo(), this.uploadDescripcion() || undefined)
      .subscribe({
        next: () => {
          this.uploading.set(false);
          // Limpia el formulario y recarga la lista
          if (this.selectedPreview()) {
            URL.revokeObjectURL(this.selectedPreview()!);
          }
          this.selectedFile.set(null);
          this.selectedPreview.set(null);
          this.uploadDescripcion.set('');
          this.loadPhotos(service.id);
        },
        error: (err) => {
          this.uploading.set(false);
          this.photosError.set(
            extractErrorMessage(err, 'No se pudo subir la foto.'),
          );
        },
      });
  }

  /** Elimina una foto (solo staff). */
  deletePhoto(photo: ServicePhoto): void {
    if (!confirm('¿Eliminar esta foto?')) return;
    this.photoService.delete(photo.id).subscribe({
      next: () => {
        const service = this.photosForService();
        if (service) this.loadPhotos(service.id);
      },
      error: (err) => {
        this.photosError.set(
          extractErrorMessage(err, 'No se pudo eliminar la foto.'),
        );
      },
    });
  }

  /** Construye la URL absoluta para mostrar la foto en un <img>. */
  photoUrl(photo: ServicePhoto): string {
    return this.photoService.absoluteUrl(photo);
  }

  /** Devuelve la clase de badge segun el tipo de foto. */
  tipoBadgeClass(tipo: string | null): string {
    switch ((tipo || '').toLowerCase()) {
      case 'entrada':
        return 'badge-info';
      case 'salida':
        return 'badge-success';
      default:
        return 'badge-muted';
    }
  }

  tipoLabel(tipo: string | null): string {
    switch ((tipo || '').toLowerCase()) {
      case 'entrada':
        return 'Entrada';
      case 'salida':
        return 'Salida';
      default:
        return 'General';
    }
  }
}
