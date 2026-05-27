import { Routes } from '@angular/router';
import { Alumnolista } from './alumnolista/alumnolista';
import { Alumnocreacion } from './alumnocreacion/alumnocreacion';
import { Alumnoedicion } from './alumnoedicion/alumnoedicion';
import { Tipodoccreacion } from './tipodoccreacion/tipodoccreacion';
import { Tipodocedicion } from './tipodocedicion/tipodocedicion';
import { Tipodoclista } from './tipodoclista/tipodoclista';

export const routes: Routes = [
    { path: 'Alumnolista', component:Alumnolista},
    { path: 'Alumnocreacion', component:Alumnocreacion},
    { path: 'Alumnoedicion', component:Alumnoedicion},
    { path: 'tipodoccreacion', component:Tipodoccreacion},
    { path: 'tipodocedicion', component:Tipodocedicion},
    { path: 'tipodoclista', component:Tipodoclista},
];
