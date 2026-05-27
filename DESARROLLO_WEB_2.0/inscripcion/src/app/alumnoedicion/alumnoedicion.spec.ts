import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alumnoedicion } from './alumnoedicion';

describe('Alumnoedicion', () => {
  let component: Alumnoedicion;
  let fixture: ComponentFixture<Alumnoedicion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alumnoedicion],
    }).compileComponents();

    fixture = TestBed.createComponent(Alumnoedicion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
