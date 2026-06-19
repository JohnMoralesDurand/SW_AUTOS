// Modelo Usuario.
// Es una class TypeScript con constructor que recibe los campos y los
// asigna a las propiedades de la instancia. Asi puedo tipar las respuestas
// del backend cuando llamo al ApiService (Observable<usuario[]>).
export class usuario {

    constructor(id: number, first_name: string, last_name: string,
        dni: string, email: string, phone: string, role: string,
        specialty: string, work_schedule: string, is_active: boolean) {

        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.dni = dni;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.specialty = specialty;
        this.work_schedule = work_schedule;
        this.is_active = is_active;
    }

    id: number;
    first_name: string;
    last_name: string;
    dni: string;
    email: string;
    phone: string;
    role: string;          // 'client' | 'mechanic' | 'admin'
    specialty: string;     // solo para mecanico
    work_schedule: string;
    is_active: boolean;
}
