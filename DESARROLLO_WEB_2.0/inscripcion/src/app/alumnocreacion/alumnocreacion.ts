import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { alumno } from '../../model/alumno.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { tipodocumentoidentidad } from '../../model/tipodocumentoidentidad.model';

@Component({
  selector: 'app-alumnocreacion',
  imports: [ButtonModule, InputTextModule, DatePickerModule, SelectModule, FormsModule],
  templateUrl: './alumnocreacion.html',
  styleUrl: './alumnocreacion.css',
})

export class Alumnocreacion {

  tiposdocumento: tipodocumentoidentidad[] = new Array();
  tipodocdni: tipodocumentoidentidad = {id: 1, tipo: "Documento Nacional de Identidad", abreviatura: "DNI"};
  nuevoAlumno: alumno = new alumno(0, '', '', '',this.tipodocdni, '', '', '', new Date());

  ngOnInit() {
    this.llenarTiposDoc();
    console.log(this.nuevoAlumno);
  }

  llenarTiposDoc() {
    const tipodocdni: tipodocumentoidentidad = {id: 1, tipo: "Documento Nacional de Identidad", abreviatura: "DNI"};
    const tipodocpte: tipodocumentoidentidad = {id: 2, tipo: "Pasaporte", abreviatura: "PTE"};
    const tipodoce: tipodocumentoidentidad = {id: 3, tipo: "Carnet de Extranjeria", abreviatura: "CE"};
    this.tiposdocumento.push(tipodocdni);
    this.tiposdocumento.push(tipodocpte);
    this.tiposdocumento.push(tipodoce);
  }

  guardarAlumno(){
    console.log(this.nuevoAlumno);
  }

}
