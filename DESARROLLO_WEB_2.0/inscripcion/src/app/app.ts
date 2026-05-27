import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenubarModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('inscripcion');

  items: MenuItem[] | undefined;

    ngOnInit() {
        this.items = [
            
            {
                label: 'Entidades',
                icon: 'pi pi-search',
                items: [
                    
                  {
                        label: 'Tipos de Documento ',
                        icon: 'pi pi-bolt',
                        routerLink: '/tipodoclista'
                    },
                    
                    {
                        label: 'Alumnos',
                        icon: 'pi pi-server',
                        routerLink: '/Alumnolista'
                    },
                    
                ]
            },
        ];
      }
}
