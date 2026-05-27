import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tipodoccreacion } from './tipodoccreacion';

describe('Tipodoccreacion', () => {
  let component: Tipodoccreacion;
  let fixture: ComponentFixture<Tipodoccreacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tipodoccreacion],
    }).compileComponents();

    fixture = TestBed.createComponent(Tipodoccreacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
