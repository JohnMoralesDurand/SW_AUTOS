// Modelo Servicio del catalogo del taller.
// Mismo formato del modelo Alumno del profe (class con constructor + campos).
export class servicio {

    constructor(id: number, name: string, description: string, category: string,
        duration_minutes: number, price: number, is_active: boolean) {

        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
        this.duration_minutes = duration_minutes;
        this.price = price;
        this.is_active = is_active;
    }

    id: number;
    name: string;
    description: string;
    category: string;
    duration_minutes: number;
    price: number;
    is_active: boolean;
}
