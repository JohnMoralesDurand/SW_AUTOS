// Variables de entorno del frontend (version mock, sin backend)
// Esta variable se conserva por compatibilidad con codigos que la lean,
// pero los services ahora usan MockDataStore (localStorage) y la ignoran.
export const environment = {
  production: false,
  apiUrl: '',
  // Bandera explicita por si algun componente quiere ramificar logica.
  useMockData: true,
};
