import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { tipodocumentoidentidad } from '../../model/tipodocumentoidentidad.model';
import { alumno } from '../../model/alumno.model';


@Component({
  selector: 'app-tipodoclista',
  imports: [TableModule, ButtonModule],
  templateUrl: './tipodoclista.html',
  styleUrl: './tipodoclista.css',
})
export class Tipodoclista {

  constructor(private router: Router) {}

  lista_tipos: tipodocumentoidentidad[] = new Array();
  
    ngOnInit() {
      this.llenarTiposDocD();
      console.log(this.lista_tipos);
    }

   llenarTiposDocD() {
    const tipodocdni: tipodocumentoidentidad = {id: 1, tipo: "Documento Nacional de Identidad", abreviatura: "DNI"};
    const tipodocpte: tipodocumentoidentidad = {id: 2, tipo: "Pasaporte", abreviatura: "PTE"};
    const tipodoce: tipodocumentoidentidad = {id: 3, tipo: "Carnet de Extranjeria", abreviatura: "CE"};
    this.lista_tipos.push(tipodocdni);
    this.lista_tipos.push(tipodocpte);
    this.lista_tipos.push(tipodoce);
  }

  borrarTipo(tipoSel: tipodocumentoidentidad) {
      this.lista_tipos = this.lista_tipos.filter(x => x.id !== tipoSel.id);
    }
    
    crearTipo() {
  
      this.router.navigate(['/tipodoccreacion']);
  
    }
  
    actualizarTipo(tipoSel: tipodocumentoidentidad) {
  
      this.router.navigate(['/tipodocedicion'],{state: {tipo: tipoSel} });
  
    }

}
