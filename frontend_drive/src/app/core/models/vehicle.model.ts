// Modelo y esquemas de validacion de vehiculos
import { z } from 'zod';

// Esquema base de un vehiculo
export const vehicleSchema = z.object({
  id: z.number(),
  owner_id: z.number(),
  license_plate: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  mileage: z.number(),
  color: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

// Esquema para registrar un nuevo vehiculo
export const vehicleCreateSchema = z.object({
  license_plate: z
    .string()
    .regex(/^[A-Z0-9]{3}-\d{3}$/i, 'Formato de placa invalido (ej: ABC-123)'),
  brand: z.string().min(1, 'La marca es obligatoria'),
  model: z.string().min(1, 'El modelo es obligatorio'),
  year: z.number().min(1950).max(2100),
  mileage: z.number().min(0),
  color: z.string().optional(),
});

export type VehicleCreate = z.infer<typeof vehicleCreateSchema>;
