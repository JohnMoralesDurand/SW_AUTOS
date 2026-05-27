import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { alumno } from '../../model/alumno.model';
import { tipodocumentoidentidad } from '../../model/tipodocumentoidentidad.model';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';


@Component({
  selector: 'app-alumnoedicion',
  imports: [ButtonModule, InputTextModule, DatePickerModule, SelectModule, FormsModule],
  templateUrl: './alumnoedicion.html',
  styleUrl: './alumnoedicion.css',
})
export class Alumnoedicion {
  
  tiposdocumento: tipodocumentoidentidad[] = new Array();
  tipodocdni: tipodocumentoidentidad = {id: 1, tipo: "Documento Nacional de Identidad", abreviatura: "DNI"};
  AlumnoEdit: alumno = new alumno(0, '', '', '',this.tipodocdni, '', '', '', new Date());

  ngOnInit() {
   
    this.llenarTiposDoc();
    this.AlumnoEdit = history.state.alumno;
    console.log(this.AlumnoEdit);
  }

  guardarAlumno(){
    console.log(this.AlumnoEdit);
  }

  llenarTiposDoc() {
    const tipodocdni: tipodocumentoidentidad = {id: 1, tipo: "Documento Nacional de Identidad", abreviatura: "DNI"};
    const tipodocpte: tipodocumentoidentidad = {id: 2, tipo: "Pasaporte", abreviatura: "PTE"};
    const tipodoce: tipodocumentoidentidad = {id: 3, tipo: "Carnet de Extranjeria", abreviatura: "CE"};
    this.tiposdocumento.push(tipodocdni);
    this.tiposdocumento.push(tipodocpte);
    this.tiposdocumento.push(tipodoce);
  }


}
