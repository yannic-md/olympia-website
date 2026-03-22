import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalImportComponent } from './modal-import.component';

describe('ModalImportComponent', () => {
  let component: ModalImportComponent;
  let fixture: ComponentFixture<ModalImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

