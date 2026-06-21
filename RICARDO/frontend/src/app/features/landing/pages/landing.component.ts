// landing.component.ts
// Es la pagina de bienvenida del taller. Es la primera pantalla que ve
// alguien que entra por primera vez, sin haber iniciado sesion. Aca
// muestro lo que ofrecemos (texto promocional), los beneficios de usar
// el sistema, los pasos para reservar una cita, y una vista resumida
// del catalogo de servicios. Tambien tiene los botones para ir al login
// o al registro.
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Wrench,
  Calendar,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Car,
  Settings,
  Gauge,
  Sparkles,
} from 'lucide-angular';

import { ServiceCatalogService } from '../../../core/services/service-catalog.service';
import { Service } from '../../../core/models/service.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit {
  // Iconos del componente
  readonly wrenchIcon = Wrench;
  readonly calendarIcon = Calendar;
  readonly shieldIcon = ShieldCheck;
  readonly clockIcon = Clock;
  readonly phoneIcon = Phone;
  readonly mailIcon = Mail;
  readonly mapIcon = MapPin;
  readonly arrowIcon = ArrowRight;
  readonly carIcon = Car;
  readonly settingsIcon = Settings;
  readonly gaugeIcon = Gauge;
  readonly sparklesIcon = Sparkles;

  // Servicios destacados que muestro en la landing (se cargan del catalogo
  // si esta disponible; si no, se queda vacio sin romper la pagina).
  readonly featuredServices = signal<Service[]>([]);

  // Beneficios que se muestran en la sección de características.
  readonly features = [
    {
      icon: ShieldCheck,
      title: 'Confianza y garantía',
      description:
        'Trabajamos con repuestos originales y mecánicos certificados con años de experiencia.',
    },
    {
      icon: Clock,
      title: 'Reservas en línea',
      description:
        'Agenda tu cita en minutos desde cualquier dispositivo, sin llamadas ni esperas.',
    },
    {
      icon: Gauge,
      title: 'Historial completo',
      description:
        'Lleva el control de cada servicio realizado a tu vehículo y recibe sugerencias de mantenimiento.',
    },
    {
      icon: Sparkles,
      title: 'Atención moderna',
      description:
        'Notificaciones automáticas, seguimiento en tiempo real y precios transparentes.',
    },
  ];

  // Pasos del proceso de reserva.
  readonly steps = [
    { number: '01', title: 'Crea tu cuenta', description: 'Registra tus datos y agrega tu vehículo.' },
    { number: '02', title: 'Elige el servicio', description: 'Revisa nuestro catálogo y selecciona lo que necesitas.' },
    { number: '03', title: 'Agenda el horario', description: 'Reserva en el bloque horario que más te convenga.' },
    { number: '04', title: 'Recibe tu vehículo', description: 'Te notificamos cuando esté listo. Así de simple.' },
  ];

  constructor(private serviceCatalog: ServiceCatalogService) {}

  /** Al cargar la pagina pido el catalogo publico (no necesita login)
   *  y me quedo solo con los primeros 6 servicios para no llenar todo. */
  ngOnInit(): void {
    this.serviceCatalog.listPublic().subscribe({
      next: (data) => this.featuredServices.set(data.slice(0, 6)),
      error: () => this.featuredServices.set([]),  // si falla, lista vacia
    });
  }
}
