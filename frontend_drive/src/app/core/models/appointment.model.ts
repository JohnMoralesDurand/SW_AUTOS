// Modelo del feature de citas
import { z } from 'zod';

// Estados validos de una cita
export const appointmentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentSchema = z.object({
  id: z.number(),
  client_id: z.number(),
  vehicle_id: z.number(),
  service_id: z.number(),
  mechanic_id: z.number().nullable().optional(),
  scheduled_at: z.string(),
  duration_minutes: z.number(),
  frozen_price: z.number(),
  notes: z.string().nullable().optional(),
  status: appointmentStatusSchema,
  cancellation_reason: z.string().nullable().optional(),
  created_at: z.string(),
  client_name: z.string().nullable().optional(),
  vehicle_plate: z.string().nullable().optional(),
  service_name: z.string().nullable().optional(),
  service_category: z.string().nullable().optional(),
  mechanic_name: z.string().nullable().optional(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const timeSlotSchema = z.object({
  start: z.string(),
  end: z.string(),
  available: z.boolean(),
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;
