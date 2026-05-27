import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { tipodocumentoidentidad } from '../../model/tipodocumentoidentidad.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-tipodoccreacion',
  imports: [ButtonModule, InputTextModule, FormsModule],
  templateUrl: './tipodoccreacion.html',
  styleUrl: './tipodoccreacion.css',
})
export class Tipodoccreacion {
  nuevoTipo: tipodocumentoidentidad = new tipodocumentoidentidad(0, '', '');

  ngOnInit() {
    console.log(this.nuevoTipo);
  }

  guardarTipo(){
    console.log(this.nuevoTipo);
  }
}