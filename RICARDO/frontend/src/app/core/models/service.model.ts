// service.model.ts
// Describe como es un Servicio del catalogo del taller (cambio de aceite,
// alineamiento, revision de frenos, etc). Igual que con vehicles, tengo
// dos schemas: uno con todos los datos (Service) y otro con solo lo que
// se pide al crear uno (ServiceCreate).
import { z } from 'zod';

// Como llega un servicio desde el backend
export const serviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),    // ej: "Motor", "Frenos"
  duration_minutes: z.number(),                  // cuanto demora en atender
  price: z.number(),                             // precio en soles
  is_active: z.boolean(),                        // false = oculto del catalogo
  created_at: z.string(),
});

export type Service = z.infer<typeof serviceSchema>;

// Datos minimos que pide el form al crear un servicio nuevo
export const serviceCreateSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category: z.string().optional(),
  duration_minutes: z.number().min(15).max(600), // entre 15 min y 10 horas
  price: z.number().min(0),                      // no se aceptan precios negativos
});

export type ServiceCreate = z.infer<typeof serviceCreateSchema>;
