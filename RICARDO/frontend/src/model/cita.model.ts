// Modelo Cita.
// Es la entidad mas usada del sistema. Tiene varios FK (client_id, vehicle_id,
// service_id, mechanic_id) igual al patron de FK del profe (Alumno -> TipoDoc).
// Cuando creo una cita desde el form solo mando los *_id; el backend devuelve
// el objeto completo con los nombres ya resueltos (truco del serializer).
export class cita {

    constructor(id: number, client_id: number, vehicle_id: number,
        service_id: number, mechanic_id: number | null,
        scheduled_at: string, duration_minutes: number, frozen_price: number,
        notes: string, status: string) {

        this.id = id;
        this.client_id = client_id;
        this.vehicle_id = vehicle_id;
        this.service_id = service_id;
        this.mechanic_id = mechanic_id;
        this.scheduled_at = scheduled_at;
        this.duration_minutes = duration_minutes;
        this.frozen_price = frozen_price;
        this.notes = notes;
        this.status = status;
    }

    id: number;
    client_id: number;
    vehicle_id: number;
    service_id: number;
    mechanic_id: number | null;  // se asigna despues
    scheduled_at: string;        // ISO
    duration_minutes: number;
    frozen_price: number;        // precio congelado al reservar
    notes: string;
    status: string;              // 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}
