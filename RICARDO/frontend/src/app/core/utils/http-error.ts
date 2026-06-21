// http-error.ts
// Funcion ayudante para sacar el mensaje "humano" cuando una llamada al
// backend falla. El backend a veces manda el error de distintas formas:
//   - { "detail": "Correo invalido" }                  (texto simple)
//   - { "detail": [{ "msg": "...", "loc": [...] }] }   (lista de errores)
//   - { "message": "..." }                             (otra clave)
//
// En vez de tener que revisar todos esos casos en cada componente, paso
// el error por aca y me devuelve siempre un string listo para mostrar
// en pantalla.
import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(
  err: unknown,
  fallback = 'Ocurrió un error inesperado.',  // mensaje por defecto
): string {
  if (!err) return fallback;

  // Solo proceso si es un error HTTP de Angular o algo parecido
  if (err instanceof HttpErrorResponse || (err as any)?.error !== undefined) {
    const detail = (err as any)?.error?.detail;

    // Caso 1: "detail" es un texto -> lo devuelvo tal cual
    if (typeof detail === 'string') return detail;

    // Caso 2: "detail" es una lista de errores -> los uno con un punto
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d: any) => (typeof d === 'string' ? d : d?.msg))
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join('. ');
    }

    // Caso 3: el error vino en la clave "message"
    const message = (err as any)?.error?.message ?? (err as any)?.message;
    if (typeof message === 'string') return message;
  }

  // Si no pude sacar nada, devuelvo el mensaje generico
  return fallback;
}
