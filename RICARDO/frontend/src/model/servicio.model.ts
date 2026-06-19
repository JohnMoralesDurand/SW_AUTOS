// Modelo Servicio del catalogo del taller.
// Class TypeScript con los campos del servicio (nombre, descripcion,
// categoria, duracion, precio) y un flag is_active para desactivar sin
// borrar.
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
