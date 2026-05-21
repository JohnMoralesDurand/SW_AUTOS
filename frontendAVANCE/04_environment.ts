// =============================================================================
// environment.ts  -  VARIABLES DE ENTORNO del frontend
// -----------------------------------------------------------------------------
// Este archivo define los valores que cambian segun el entorno donde corre la
// aplicacion (desarrollo, produccion, pruebas). El resto del codigo importa
// estas variables en vez de tener URLs "quemadas" (hardcoded).
//
// Beneficios:
//   - Cambiar de servidor de desarrollo a produccion sin tocar el codigo.
//   - Mantener una sola fuente de verdad para configuraciones del entorno.
//   - Facilita el despliegue (deploy) en diferentes servidores.
//
// Variables actuales:
//   - production: false  -> indica que estamos en modo desarrollo.
//   - apiUrl: URL base del backend FastAPI. Todos los servicios la concatenan
//             con su endpoint (p.ej. apiUrl + '/appointments').
// =============================================================================
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
};
