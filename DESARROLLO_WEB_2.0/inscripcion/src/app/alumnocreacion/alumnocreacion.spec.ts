import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alumnocreacion } from './alumnocreacion';

describe('Alumnocreacion', () => {
  let component: Alumnocreacion;
  let fixture: ComponentFixture<Alumnocreacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alumnocreacion],
    }).compileComponents();

    fixture = TestBed.createComponent(Alumnocreacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
