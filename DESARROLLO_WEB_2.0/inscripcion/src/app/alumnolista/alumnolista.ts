import { Component } from '@angular/core';
import { alumno } from '../../model/alumno.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { tipodocumentoidentidad } from '../../model/tipodocumentoidentidad.model';

@Component({
  selector: 'app-alumnolista',
  imports: [TableModule, ButtonModule, DatePipe],
  templateUrl: './alumnolista.html',
  styleUrl: './alumnolista.css',
})
export class Alumnolista {

  constructor(private router: Router) { }

  // Aquí puedes inicializar tu lista de alumnos con datos reales o vacía
  lista_Alumnos: alumno[] = new Array();

  ngOnInit() {
    this.llenarAlumnos();
    console.log(this.lista_Alumnos);
  }

  llenarAlumnos() {

    const tipodocdni: tipodocumentoidentidad = {id: 1, tipo: "Documento Nacional de Identidad", abreviatura: "DNI"};
    const tipodocpte: tipodocumentoidentidad = {id: 2, tipo: "Pasaporte", abreviatura: "PTE"};
    const alumno1:  alumno = {id: 1,ap: "PEREZ", am: "LOPEZ", nombre: "JUAN", tipo_documento: tipodocdni, numero_documento: "12345678", correo: "juan@gmail.com", telefono: "901796553", fechaNacimiento: new Date("2000-01-01")};
    const alumno2:  alumno = {id: 2,ap: "QUISPE", am: "Mamani", nombre: "MARIA", tipo_documento: tipodocpte, numero_documento: "87654321", correo: "maria@gmail.com", telefono: "912345678", fechaNacimiento: new Date("1999-05-14")};
    const alumno3:  alumno = {id: 3,ap: "RAMIREZ", am: "Torres", nombre: "CARLOS", tipo_documento: tipodocdni, numero_documento: "11223344", correo: "carlos@gmail.com", telefono: "923456789", fechaNacimiento: new Date("2001-08-23")};
    const alumno4:  alumno = {id: 4,ap: "FLORES", am: "Vega", nombre: "ANA", tipo_documento: tipodocdni, numero_documento: "55667788", correo: "ana@gmail.com", telefono: "934567890", fechaNacimiento: new Date("2000-11-02")};
    const alumno5:  alumno = {id: 5,ap: "HUAMAN", am: "Rojas", nombre: "LUIS", tipo_documento: tipodocdni, numero_documento: "99887766", correo: "luis@gmail.com", telefono: "945678901", fechaNacimiento: new Date("1998-03-19")};
    const alumno6:  alumno = {id: 6,ap: "GARCIA", am: "Sanchez", nombre: "SOPHIA", tipo_documento: tipodocdni, numero_documento: "66778899", correo: "sophia@gmail.com", telefono: "956789012", fechaNacimiento: new Date("2002-07-30")};
    const alumno7:  alumno = {id: 7,ap: "MENDOZA", am: "Castro", nombre: "DIEGO", tipo_documento: tipodocdni, numero_documento: "44332211", correo: "diego@gmail.com", telefono: "967890123", fechaNacimiento: new Date("1999-12-08")};
    const alumno8:  alumno = {id: 8,ap: "SOTO", am: "Gomez", nombre: "ELENA", tipo_documento: tipodocdni, numero_documento: "77665544", correo: "elena@gmail.com", telefono: "978901234", fechaNacimiento: new Date("2000-04-15")};
    const alumno9:  alumno = {id: 9,ap: "RODRIGUEZ", am: "Diaz", nombre: "MARIO", tipo_documento: tipodocdni, numero_documento: "33445566", correo: "mario@gmail.com", telefono: "989012345", fechaNacimiento: new Date("1998-09-22")};
    const alumno10: alumno = {id: 10,ap: "ALVAREZ", am: "Molina", nombre: "LAURA", tipo_documento: tipodocdni, numero_documento: "55664433", correo: "laura@gmail.com", telefono: "990123456", fechaNacimiento: new Date("1999-02-28")};
        
    this.lista_Alumnos.push(alumno1);
    this.lista_Alumnos.push(alumno2);
    this.lista_Alumnos.push(alumno3);
    this.lista_Alumnos.push(alumno4);
    this.lista_Alumnos.push(alumno5);
    this.lista_Alumnos.push(alumno6);
    this.lista_Alumnos.push(alumno7);
    this.lista_Alumnos.push(alumno8);
    this.lista_Alumnos.push(alumno9);
    this.lista_Alumnos.push(alumno10);
    
  }

  borrarAlumno(alumnoSel: alumno) {
    this.lista_Alumnos = this.lista_Alumnos.filter(x => x.id !== alumnoSel.id);
  }
  
  crearAlumno() {

    this.router.navigate(['/Alumnocreacion']);

  }

  actualizarAlumno(alumnoSel: alumno) {

    this.router.navigate(['/Alumnoedicion'],{state: {alumno: alumnoSel} });

  }

}
