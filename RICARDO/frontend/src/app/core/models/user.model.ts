// user.model.ts
// Describe como es un Usuario en el sistema. Lo uso desde los services
// para saber los campos que vienen del backend. Tambien uso una libreria
// llamada Zod que valida la forma de los datos: si llegara algo distinto
// a lo que espero, salta un error y me entero al toque.
import { z } from 'zod';

// Los 3 roles que puede tener un usuario
export const userRoleSchema = z.enum(['client', 'mechanic', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// La forma de un usuario tal como llega del backend Django
export const userSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  dni: z.string(),
  email: z.string().email(),                       // .email() valida que sea un correo valido
  phone: z.string().nullable().optional(),         // puede venir null o no venir
  role: userRoleSchema,
  specialty: z.string().nullable().optional(),     // solo para mecanico
  work_schedule: z.string().nullable().optional(), // horario laboral del mecanico
  is_active: z.boolean(),                          // false = desactivado
  created_at: z.string(),
});

// Esta linea crea automaticamente el tipo TypeScript "User" en base al schema
export type User = z.infer<typeof userSchema>;

// La forma de la respuesta cuando el backend acepta el login: trae el
// token de sesion (lo que usa el navegador para identificarse despues) y
// los datos del usuario que entro.
export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user: userSchema,
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
