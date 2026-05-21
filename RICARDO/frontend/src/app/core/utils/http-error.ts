// =============================================================================
// Utilidad para extraer mensajes legibles desde respuestas de error HTTP.
// -----------------------------------------------------------------------------
// FastAPI puede devolver el campo "detail" en tres formas:
//   - Cadena simple:    { "detail": "No autorizado" }
//   - Lista de objetos: { "detail": [{ "msg": "...", "loc": [...] }] }
//     (esto sucede cuando Pydantic valida el body y falla)
//   - Cadena en otra clave (e.g. "message")
//
// Esta funcion normaliza todos los casos a un solo string que se puede mostrar.
// =============================================================================
import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(
  err: unknown,
  fallback = 'Ocurrió un error inesperado.',
): string {
  if (!err) return fallback;

  // Errores HTTP de Angular
  if (err instanceof HttpErrorResponse || (err as any)?.error !== undefined) {
    const detail = (err as any)?.error?.detail;

    // Caso 1: detail es un string -> devolverlo directamente
    if (typeof detail === 'string') return detail;

    // Caso 2: detail es un array de errores Pydantic -> juntar los msg
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d: any) => (typeof d === 'string' ? d : d?.msg))
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join('. ');
    }

    // Caso 3: el body es directamente un mensaje
    const message = (err as any)?.error?.message ?? (err as any)?.message;
    if (typeof message === 'string') return message;
  }

  return fallback;
}
