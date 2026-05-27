import { tipodocumentoidentidad } from "./tipodocumentoidentidad.model";

export class alumno {

    constructor(id: number, ap: string, am: string, nombre: string, 
        tipo_documento: tipodocumentoidentidad, numero_documento: string, 
        correo: string, telefono: string, fechaNacimiento: Date) {

        this.id = id;
        this.ap = ap;
        this.am = am;
        this.nombre = nombre;
        this.tipo_documento = tipo_documento;
        this.numero_documento = numero_documento;
        this.correo = correo;
        this.telefono = telefono;
        this.fechaNacimiento = fechaNacimiento;
    }

    id: number;
    ap: string;
    am: string;
    nombre: string;
    tipo_documento: tipodocumentoidentidad;
    numero_documento: string;
    correo: string;
    telefono: string;
    fechaNacimiento: Date;
}