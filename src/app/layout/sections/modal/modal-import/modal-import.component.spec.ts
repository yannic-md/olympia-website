import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ModalImportComponent } from './modal-import.component';
import { AlertService } from '../../../../services/api/alert/alert.service';

describe('ModalImportComponent', () => {
  let component: ModalImportComponent;
  let fixture: ComponentFixture<ModalImportComponent>;
  let alertService: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalImportComponent, HttpClientTestingModule, TranslateModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalImportComponent);
    component = fixture.componentInstance;
    alertService = TestBed.inject(AlertService);
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('importType', 'athletes');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enable drag state on dragover', () => {
    const event = { preventDefault: jest.fn() } as unknown as DragEvent;

    (component as any).onDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect((component as any).isDragActive()).toBe(true);
  });

  it('should accept a valid dropped file', () => {
    const file = new File(['id,name'], 'athletes.csv', { type: 'text/csv' });
    const event = {
      preventDefault: jest.fn(),
      dataTransfer: { files: [file] }
    } as unknown as DragEvent;

    (component as any).onDrop(event);

    expect((component as any).selectedFile()).toBe(file);
    expect((component as any).isDragActive()).toBe(false);
  });

  it('should reject an invalid dropped file', () => {
    jest.spyOn(alertService, 'error');
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
    const event = {
      preventDefault: jest.fn(),
      dataTransfer: { files: [file] }
    } as unknown as DragEvent;

    (component as any).onDrop(event);

    expect(alertService.error).toHaveBeenCalled();
    expect((component as any).selectedFile()).toBeNull();
  });
});

