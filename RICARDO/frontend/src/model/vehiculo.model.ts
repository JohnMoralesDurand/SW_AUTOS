// Modelo Vehiculo.
// Aca un Vehiculo tiene un dueño (owner_id), que es la FK al Usuario, igual
// que como en el ejemplo del profe el Alumno tenia una FK a TipoDocumento.
export class vehiculo {

    constructor(id: number, owner_id: number, license_plate: string,
        brand: string, model: string, year: number, mileage: number,
        color: string, is_active: boolean) {

        this.id = id;
        this.owner_id = owner_id;
        this.license_plate = license_plate;
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.mileage = mileage;
        this.color = color;
        this.is_active = is_active;
    }

    id: number;
    owner_id: number;       // FK al usuario dueño
    license_plate: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    color: string;
    is_active: boolean;
}
