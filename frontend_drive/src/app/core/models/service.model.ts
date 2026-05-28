// Modelo del catalogo de servicios
import { z } from 'zod';

export const serviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  duration_minutes: z.number(),
  price: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type Service = z.infer<typeof serviceSchema>;

export const serviceCreateSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category: z.string().optional(),
  duration_minutes: z.number().min(15).max(600),
  price: z.number().min(0),
});

export type ServiceCreate = z.infer<typeof serviceCreateSchema>;
