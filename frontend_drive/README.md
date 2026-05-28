# AutoServ — Frontend de Entrega (Mock / Sin Backend)

Esta carpeta contiene la versión del frontend Angular **lista para subirse al Drive del curso**. Funciona de forma totalmente autónoma: no necesita backend ni base de datos. Toda la información se guarda en `localStorage` del navegador.

> Si lo que buscas es la versión conectada al backend Django, ve a la carpeta `RICARDO/frontend/` del proyecto principal.

---

## Cómo se ejecuta

```bash
npm install
npm start
```

La aplicación queda corriendo en `http://localhost:4200`.

> Build estática para entrega: `npm run build`. El resultado queda en `dist/` y se puede abrir desde cualquier servidor estático.

---

## Usuarios de prueba (seed inicial)

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@autoserv.pe` | `admin123` |
| Mecánico (Motor) | `mecanico@autoserv.pe` | `mecanico123` |
| Mecánico (Frenos) | `jorge.mendoza@autoserv.pe` | `mecanico123` |
| Mecánico (Electricidad) | `luis.perez@autoserv.pe` | `mecanico123` |
| Cliente | `cliente@autoserv.pe` | `cliente123` |
| Cliente | `pedro.cliente@autoserv.pe` | `cliente123` |

Los datos vienen del archivo `src/assets/mock-data/seed.json`. Si quieres regenerar todo desde cero, abre la consola del navegador y ejecuta:

```js
localStorage.clear();
location.reload();
```

---

## Arquitectura del mock

```
src/
├── assets/mock-data/seed.json           # datos iniciales (usuarios, servicios, horarios)
└── app/core/
    ├── mock/mock-data.store.ts          # store en memoria + persistencia localStorage
    └── services/                        # services con misma API Observable<T>
        ├── auth.service.ts              # login/register validando contra el store
        ├── user.service.ts              # CRUD usuarios + mecánicos
        ├── vehicle.service.ts           # CRUD vehículos
        ├── service-catalog.service.ts   # CRUD catálogo de servicios
        ├── appointment.service.ts       # citas + reglas RN-03..RN-07
        ├── work-order.service.ts        # órdenes de trabajo + items
        ├── service-photo.service.ts     # fotos como data URLs (base64)
        ├── notification.service.ts      # notificaciones por usuario
        ├── schedule.service.ts          # horario semanal del taller
        ├── report.service.ts            # KPIs y reportes calculados en cliente
        └── vehicle-history.service.ts   # historial + sugerencias preventivas
```

Detalles clave:

- **`MockDataStore`** centraliza el estado y persiste cualquier cambio en `localStorage` bajo la clave `autoserv_mock_db`.
- **Todos los services siguen devolviendo `Observable<T>`** (con un `delay` pequeño para que se sienta como una llamada real), por lo que los componentes no necesitan cambios.
- **Reglas de negocio replicadas** (validaciones de citas, especialidad del mecánico, cierre de orden, total recalculado, etc.).
- **Notificaciones automáticas**: al reservar una cita y al cerrar una orden.
- **Fotos**: se guardan como `data:image/...;base64,...` dentro del propio `localStorage`. Límite: 2 MB por imagen.

---

## Flujo de demo sugerido (para grabación o capturas)

1. Login como **cliente** → registrar vehículo → reservar cita.
2. Logout, login como **admin** → ver dashboard → confirmar la cita → asignar mecánico.
3. Logout, login como **mecánico** → "Órdenes de trabajo" → escribir diagnóstico → agregar repuestos → subir foto de entrada → cerrar orden.
4. Login de nuevo como cliente → ver notificación de "servicio completado" + foto en el detalle de la cita.

---

## Diferencias con la versión conectada al backend

| Aspecto | Versión backend | Versión mock (esta) |
| --- | --- | --- |
| Autenticación | JWT real | Token simulado, valida en localStorage |
| Datos persistentes | SQLite vía Django | `localStorage` del navegador |
| Fotos | Archivos en disco (MEDIA_ROOT) | Base64 inline |
| HttpClient | Sí | **No usado** (no se provee) |
| Interceptor de auth | Sí | Eliminado |

Si necesitas volver a la versión con backend, abre la carpeta del proyecto principal — esta versión es exclusivamente para entrega académica.
