import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AlertService } from './alert.service';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty alerts signal', () => {
    expect(service.alerts()).toEqual([]);
  });

  describe('show', () => {
    it('should add alert with correct properties and increment id', () => {
      service.show('Test message', 'success', 0);

      const alerts = service.alerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Test message');
      expect(alerts[0].type).toBe('success');
      expect(alerts[0].id).toBe(1);
      expect(alerts[0].leaving).toBeUndefined();
    });

    it('should increment id counter for each alert', () => {
      service.show('First', 'info', 0);
      service.show('Second', 'error', 0);
      service.show('Third', 'warning', 0);

      const alerts = service.alerts();
      expect(alerts).toHaveLength(3);
      expect(alerts[0].id).toBe(1);
      expect(alerts[1].id).toBe(2);
      expect(alerts[2].id).toBe(3);
    });

    it('should use default type "info" when not specified', () => {
      service.show('Default type message');

      const alerts = service.alerts();
      expect(alerts[0].type).toBe('info');
    });

    it('should use default duration 4000ms when not specified', fakeAsync(() => {
      service.show('Auto dismiss message', 'success');

      expect(service.alerts()).toHaveLength(1);

      tick(3999);
      expect(service.alerts()).toHaveLength(1);

      tick(1);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));

    it('should auto-dismiss alert after specified duration', fakeAsync(() => {
      service.show('Quick dismiss', 'warning', 1000);

      expect(service.alerts()).toHaveLength(1);

      tick(999);
      expect(service.alerts()).toHaveLength(1);

      tick(1);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));

    it('should not auto-dismiss when duration is 0', fakeAsync(() => {
      service.show('Persistent message', 'error', 0);

      expect(service.alerts()).toHaveLength(1);

      tick(10000);
      expect(service.alerts()).toHaveLength(1);
      expect(service.alerts()[0].leaving).toBeUndefined();
    }));

    it('should not auto-dismiss when duration is negative', fakeAsync(() => {
      service.show('Negative duration', 'info', -100);

      expect(service.alerts()).toHaveLength(1);

      tick(5000);
      expect(service.alerts()).toHaveLength(1);
    }));

    it('should handle multiple alerts with different durations', fakeAsync(() => {
      service.show('Fast', 'info', 500);
      service.show('Slow', 'warning', 2000);
      service.show('Persistent', 'success', 0);

      expect(service.alerts()).toHaveLength(3);

      tick(500);
      expect(service.alerts().filter(a => a.leaving).length).toBe(1);

      tick(200);
      expect(service.alerts()).toHaveLength(2);

      tick(1300);
      expect(service.alerts().filter(a => a.leaving).length).toBe(1);

      tick(200);
      expect(service.alerts()).toHaveLength(1);
      expect(service.alerts()[0].message).toBe('Persistent');
    }));
  });

  describe('dismiss', () => {
    it('should set leaving flag and remove alert after 200ms', fakeAsync(() => {
      service.show('Test', 'info', 0);
      const alertId = service.alerts()[0].id;

      service.dismiss(alertId);

      const alertsAfterDismiss = service.alerts();
      expect(alertsAfterDismiss).toHaveLength(1);
      expect(alertsAfterDismiss[0].leaving).toBe(true);

      tick(199);
      expect(service.alerts()).toHaveLength(1);

      tick(1);
      expect(service.alerts()).toHaveLength(0);
    }));

    it('should not modify other alerts when dismissing specific alert', fakeAsync(() => {
      service.show('First', 'info', 0);
      service.show('Second', 'warning', 0);
      service.show('Third', 'error', 0);

      const secondId = service.alerts()[1].id;

      service.dismiss(secondId);

      expect(service.alerts()).toHaveLength(3);
      expect(service.alerts()[0].leaving).toBeUndefined();
      expect(service.alerts()[1].leaving).toBe(true);
      expect(service.alerts()[2].leaving).toBeUndefined();

      tick(200);

      const remaining = service.alerts();
      expect(remaining).toHaveLength(2);
      expect(remaining[0].message).toBe('First');
      expect(remaining[1].message).toBe('Third');
    }));

    it('should handle dismissing non-existent alert gracefully', fakeAsync(() => {
      service.show('Test', 'info', 0);

      service.dismiss(999);

      expect(service.alerts()).toHaveLength(1);
      expect(service.alerts()[0].leaving).toBeUndefined();

      tick(200);
      expect(service.alerts()).toHaveLength(1);
    }));

    it('should handle multiple dismiss calls for same alert', fakeAsync(() => {
      service.show('Test', 'info', 0);
      const alertId = service.alerts()[0].id;

      service.dismiss(alertId);
      service.dismiss(alertId);

      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));
  });

  describe('success', () => {
    it('should call show with success type and custom duration', fakeAsync(() => {
      service.success('Success message', 2000);

      const alerts = service.alerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Success message');
      expect(alerts[0].type).toBe('success');

      tick(2000);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));

    it('should use default duration when not specified', fakeAsync(() => {
      service.success('Default duration');

      tick(4000);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));
  });

  describe('error', () => {
    it('should call show with error type and custom duration', fakeAsync(() => {
      service.error('Error message', 3000);

      const alerts = service.alerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Error message');
      expect(alerts[0].type).toBe('error');

      tick(3000);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));

    it('should use default duration when not specified', fakeAsync(() => {
      service.error('Default duration');

      tick(4000);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));
  });

  describe('warning', () => {
    it('should call show with warning type and custom duration', fakeAsync(() => {
      service.warning('Warning message', 1500);

      const alerts = service.alerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Warning message');
      expect(alerts[0].type).toBe('warning');

      tick(1500);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));

    it('should use default duration when not specified', fakeAsync(() => {
      service.warning('Default duration');

      tick(4000);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));
  });

  describe('info', () => {
    it('should call show with info type and custom duration', fakeAsync(() => {
      service.info('Info message', 2500);

      const alerts = service.alerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Info message');
      expect(alerts[0].type).toBe('info');

      tick(2500);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));

    it('should use default duration when not specified', fakeAsync(() => {
      service.info('Default duration');

      tick(4000);
      expect(service.alerts()[0].leaving).toBe(true);

      tick(200);
      expect(service.alerts()).toHaveLength(0);
    }));
  });
});
