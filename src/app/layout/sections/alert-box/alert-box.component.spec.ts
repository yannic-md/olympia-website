import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AlertBoxComponent } from './alert-box.component';
import { AlertMessage, AlertService } from '../../../services/api/alert/alert.service';

describe('AlertBoxComponent', () => {
  let component: AlertBoxComponent;
  let fixture: ComponentFixture<AlertBoxComponent>;
  let alertService: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertBoxComponent);
    component = fixture.componentInstance;
    alertService = TestBed.inject(AlertService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return expected classes and icons for all supported alert types', () => {
    const cases: Array<{ type: AlertMessage['type']; classes: string; icon: string }> = [
      {
        type: 'success',
        classes: 'bg-green-100 border-green-400 text-green-800',
        icon: 'M5 13l4 4L19 7',
      },
      {
        type: 'error',
        classes: 'bg-red-100 border-red-400 text-red-800',
        icon: 'M6 18L18 6M6 6l12 12',
      },
      {
        type: 'warning',
        classes: 'bg-yellow-100 border-yellow-400 text-yellow-800',
        icon: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      },
      {
        type: 'info',
        classes: 'bg-blue-100 border-blue-400 text-blue-800',
        icon: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z',
      },
    ];

    cases.forEach((testCase, index) => {
      const alert: AlertMessage = { id: index + 1, message: 'message', type: testCase.type };
      expect((component as any).getAlertClasses(alert)).toBe(testCase.classes);
      expect((component as any).getIcon(alert)).toBe(testCase.icon);
    });
  });

  it('should fallback to info class and icon for unknown alert type', () => {
    const unknownAlert = { id: 99, message: 'x', type: 'unknown' } as unknown as AlertMessage;

    expect((component as any).getAlertClasses(unknownAlert)).toBe('bg-blue-100 border-blue-400 text-blue-800');
    expect((component as any).getIcon(unknownAlert)).toBe('M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z');
  });

  it('should call dismiss with the alert id when alert is clicked', () => {
    const dismissSpy = jest.spyOn(alertService, 'dismiss').mockImplementation(() => undefined);
    alertService.alerts.set([{ id: 7, message: 'Dismiss me', type: 'info' }]);
    fixture.detectChanges();

    const alertElement = fixture.debugElement.query(By.css('[role="alert"]'));
    alertElement.triggerEventHandler('click', {});

    expect(dismissSpy).toHaveBeenCalledWith(7);
  });
});
