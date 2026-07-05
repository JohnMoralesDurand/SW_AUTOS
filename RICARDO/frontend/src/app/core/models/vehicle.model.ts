// vehicle.model.ts
// Describe como es un Vehiculo en el sistema. Tengo dos schemas: uno para
// los datos que vienen del backend (Vehicle) y otro para los datos que
// mando al crear uno nuevo (VehicleCreate). Asi puedo poner reglas mas
// estrictas al crear (ej: la placa tiene que cumplir el formato peruano
// ABC-123).
import { z } from 'zod';

// Como llega un vehiculo desde el backend (la relacion al dueño viene
// como "owner" con el ID adentro, igual que la serializa Django)
export const vehicleSchema = z.object({
  id: z.number(),
  owner: z.number(),                               // id del cliente dueño del auto
  license_plate: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  mileage: z.number(),                             // kilometraje actual
  color: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

// Forma que tiene que cumplir el formulario para registrar un auto nuevo.
// Aca van las reglas de validacion para que el usuario no mande basura.
export const vehicleCreateSchema = z.object({
  license_plate: z
    .string()
    .regex(/^[A-Z0-9]{3}-\d{3}$/i, 'Formato de placa invalido (ej: ABC-123)'),
  brand: z.string().min(1, 'La marca es obligatoria'),
  model: z.string().min(1, 'El modelo es obligatorio'),
  year: z.number().min(1950).max(2100),            // año entre 1950 y 2100
  mileage: z.number().min(0),                      // no se aceptan negativos
  color: z.string().optional(),
});

export type VehicleCreate = z.infer<typeof vehicleCreateSchema>;
