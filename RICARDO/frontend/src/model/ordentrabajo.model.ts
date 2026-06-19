// Modelo Orden de Trabajo.
// Se crea automaticamente cuando una cita pasa a estado "in_progress".
// El mecanico anota el diagnostico, agrega items (repuestos / mano de
// obra) y al final cierra la orden. Tiene FK al appointment.
export class ordentrabajo {

    constructor(id: number, appointment_id: number, diagnosis: string,
        total_amount: number, status: string, closed_at: string) {

        this.id = id;
        this.appointment_id = appointment_id;
        this.diagnosis = diagnosis;
        this.total_amount = total_amount;
        this.status = status;
        this.closed_at = closed_at;
    }

    id: number;
    appointment_id: number;     // FK a la cita
    diagnosis: string;
    total_amount: number;
    status: string;             // 'open' | 'closed'
    closed_at: string;
}
