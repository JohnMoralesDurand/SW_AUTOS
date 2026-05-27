import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { tipodocumentoidentidad } from '../../model/tipodocumentoidentidad.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-tipodocedicion',
  imports: [FormsModule, ButtonModule, InputTextModule],
  templateUrl: './tipodocedicion.html',
  styleUrl: './tipodocedicion.css',
})
export class Tipodocedicion {
  tipoEdicion: tipodocumentoidentidad = new tipodocumentoidentidad(0, '', '');

  ngOnInit() {
    this.tipoEdicion = history.state.tipo;
    console.log(this.tipoEdicion);
  }

  guardarTipo(){
    console.log(this.tipoEdicion);
  }
}