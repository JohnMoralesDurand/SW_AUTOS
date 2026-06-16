// =============================================================================
// user.model.ts  -  MODELO del Usuario
// -----------------------------------------------------------------------------
// Define COMO LUCE un usuario en el frontend. Es un "contrato de datos" con
// el backend: cualquier objeto User que reciba el frontend debe tener esta
// forma exacta (mismos campos, mismos tipos).
//
// Tecnologias usadas:
//
//   ZOD:
//     Libreria que valida en tiempo de ejecucion que los datos recibidos del
//     API tengan el formato esperado. Si el backend envia algo inesperado,
//     Zod arroja un error claro en vez de propagar datos corruptos.
//
//   TypeScript types:
//     z.infer<typeof userSchema> extrae automaticamente el tipo TypeScript a
//     partir del esquema Zod. Asi no escribimos dos veces lo mismo: el
//     esquema (para validar) y el tipo (para autocompletado).
//
// Exporta tres cosas:
//   1. userRoleSchema / UserRole       -> roles posibles (client | mechanic | admin)
//   2. userSchema     / User           -> forma del usuario
//   3. tokenResponseSchema / TokenResponse -> respuesta del endpoint de login
// =============================================================================
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
