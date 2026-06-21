// environment.ts
// Aca pongo la direccion donde corre el backend. La importan todos los
// services para saber a donde mandar las peticiones HTTP. Si algun dia
// el backend se publica en otro servidor, solo tengo que cambiar esta
// linea y todo lo demas sigue funcionando.
export const environment = {
  production: false,                         // false porque estoy en desarrollo
  apiUrl: 'http://localhost:8001/api',       // Django esta en el puerto 8001
};
