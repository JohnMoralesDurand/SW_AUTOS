import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alumnolista } from './alumnolista';

describe('Alumnolista', () => {
  let component: Alumnolista;
  let fixture: ComponentFixture<Alumnolista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alumnolista],
    }).compileComponents();

    fixture = TestBed.createComponent(Alumnolista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
