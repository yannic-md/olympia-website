import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAthleteComponent } from './modal-athlete.component';

describe('ModalAthleteComponent', () => {
  let component: ModalAthleteComponent;
  let fixture: ComponentFixture<ModalAthleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAthleteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAthleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
