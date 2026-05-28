// Modelos y esquemas de validacion del usuario
// Se utiliza Zod para validar los datos recibidos del API
import { z } from 'zod';

// Roles posibles dentro del sistema
export const userRoleSchema = z.enum(['client', 'mechanic', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Esquema de un usuario tal como lo devuelve el backend
export const userSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  dni: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  role: userRoleSchema,
  specialty: z.string().nullable().optional(),
  work_schedule: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type User = z.infer<typeof userSchema>;

// Esquema de la respuesta de login
export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user: userSchema,
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
