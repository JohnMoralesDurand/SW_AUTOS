// appointment.model.ts
// Describe como es una Cita (la entidad mas importante del sistema).
// Tiene varios ids de las cosas relacionadas (cliente, auto, servicio,
// mecanico) y ademas los nombres ya resueltos por el backend (asi no
// tengo que ir a buscarlos despues a cada tabla).
import { z } from 'zod';

// Los 5 estados por los que pasa una cita en su ciclo de vida:
//   pending     -> recien reservada, esperando confirmacion del admin
//   confirmed   -> admin la confirmo, lista para asignar mecanico
//   in_progress -> mecanico esta atendiendo el auto
//   completed   -> mecanico cerro la orden de trabajo
//   cancelled   -> alguien la cancelo
export const appointmentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

// Como llega una cita desde el backend.
// Ojo: Django serializa las relaciones con el nombre del campo tal cual
// (client, vehicle, service, mechanic) y trae el ID adentro. Antes aca
// decian client_id / mechanic_id y no coincidian con la respuesta real.
export const appointmentSchema = z.object({
  id: z.number(),
  client: z.number(),
  vehicle: z.number(),
  service: z.number(),
  mechanic: z.number().nullable().optional(),     // empieza null hasta que el admin asigne uno
  scheduled_at: z.string(),                       // fecha y hora ISO
  duration_minutes: z.number(),
  frozen_price: z.number(),                       // precio del servicio al momento de reservar
  notes: z.string().nullable().optional(),
  status: appointmentStatusSchema,
  cancellation_reason: z.string().nullable().optional(),
  is_late_cancellation: z.boolean().optional(),   // true si cancelo con <3h de anticipacion
  created_at: z.string(),
  // Estos son los nombres legibles que el backend ya resuelve por mi para
  // no tener que hacer mas peticiones por cada cita.
  client_name: z.string().nullable().optional(),
  vehicle_plate: z.string().nullable().optional(),
  service_name: z.string().nullable().optional(),
  service_category: z.string().nullable().optional(),
  mechanic_name: z.string().nullable().optional(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

// Cada bloque de hora disponible que muestra el form de "nueva cita".
// Si available=false significa que ya esta ocupado o no se puede reservar
// por la regla de "minimo 2 horas de anticipacion".
export const timeSlotSchema = z.object({
  start: z.string(),
  end: z.string(),
  available: z.boolean(),
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;
