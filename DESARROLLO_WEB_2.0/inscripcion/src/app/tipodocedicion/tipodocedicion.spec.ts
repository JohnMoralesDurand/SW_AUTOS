import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tipodocedicion } from './tipodocedicion';

describe('Tipodocedicion', () => {
  let component: Tipodocedicion;
  let fixture: ComponentFixture<Tipodocedicion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tipodocedicion],
    }).compileComponents();

    fixture = TestBed.createComponent(Tipodocedicion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
