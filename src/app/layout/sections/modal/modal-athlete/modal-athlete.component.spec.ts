import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { defer } from 'rxjs';

import { ModalAthleteComponent } from './modal-athlete.component';
import { MiscService } from '../../../../services/misc/misc.service';
import { AthleteService } from '../../../../services/api/athlete/athlete.service';
import { DataHolderService } from '../../../../services/data-holder/data-holder.service';
import { AlertService } from '../../../../services/api/alert/alert.service';

describe('ModalAthleteComponent', () => {
  let component: ModalAthleteComponent;
  let fixture: ComponentFixture<ModalAthleteComponent>;

  const miscService: Pick<MiscService, 'updateField'> = {
    updateField: jest.fn()
  };

  const athleteService: Pick<AthleteService, 'createAthlete' | 'patchAthleteAdd'> = {
    createAthlete: jest.fn(),
    patchAthleteAdd: jest.fn()
  };

  const dataService: Pick<DataHolderService, 'countriesData'> = {
    countriesData: jest.fn()
  } as any;

  const alertService: Pick<AlertService, 'success' | 'error'> = {
    success: jest.fn(),
    error: jest.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAthleteComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: MiscService, useValue: miscService },
        { provide: AthleteService, useValue: athleteService },
        { provide: DataHolderService, useValue: dataService },
        { provide: AlertService, useValue: alertService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalAthleteComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('athletes', [
      { id: 1, firstName: 'John', lastName: 'Doe' } as any,
      { id: 2, firstName: 'Anna', lastName: 'Smith' } as any
    ]);
    fixture.componentRef.setInput('countries', ['Germany', 'France']);

    jest.spyOn(miscService, 'updateField').mockImplementation((target: any, key: string, value: string): void => {
      target.update((current: any) => ({ ...current, [key]: value }));
    });

    jest.spyOn(dataService, 'countriesData').mockReturnValue([
      { countryId: 99, countryName: 'Germany' } as any
    ]);

    jest.spyOn(TestBed.inject(TranslateService), 'instant').mockImplementation((key: string | string[]): string => {
      const normalizedKey: string = Array.isArray(key) ? key[0] ?? '' : key;
      if (normalizedKey === 'MODAL.ATHLETE.NAME.ERROR') return 'Name error';
      if (normalizedKey === 'ALERT.ATHLETE.ADD') return 'Added [name]';
      if (normalizedKey === 'ALERT.ATHLETE.ADD.ERROR') return 'Add failed [name]';
      return normalizedKey;
    });

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply editData via effect, clear name error and enable edit mode', () => {
    (component as any).nameError.set('old error');
    fixture.componentRef.setInput('editData', {
      id: 3,
      name: 'Edit User',
      countryCode: 'DE',
      countryName: 'Germany',
      sport: 'Run',
      sportRawName: 'run',
      scoreType: null,
      goldMedals: 1,
      silverMedals: 2,
      bronzeMedals: 3,
      bestTime: '00:10'
    });
    fixture.detectChanges();

    expect((component as any).formData().name).toBe('Edit User');
    expect((component as any).nameError()).toBe('');
    expect((component as any).isEditMode()).toBe(true);
  });

  it('should restore resumeData via effect and clear name error', () => {
    (component as any).nameError.set('old error');
    fixture.componentRef.setInput('resumeData', {
      id: 0,
      name: 'Resume User',
      countryCode: '',
      countryName: 'France',
      sport: '',
      sportRawName: '',
      scoreType: null,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
      bestTime: ''
    });
    fixture.detectChanges();

    expect((component as any).formData().name).toBe('Resume User');
    expect((component as any).formData().countryName).toBe('France');
    expect((component as any).nameError()).toBe('');
  });

  it('should update country fields when onCountryChange is called', () => {
    (component as any).formData.set({ ...(component as any).formData(), countryCode: 'OLD', countryName: 'Oldland' });

    (component as any).onCountryChange('Germany');

    expect((component as any).formData().countryName).toBe('Germany');
    expect((component as any).formData().countryCode).toBe('');
  });

  it('should validate name, set/remove nameError and call updateField', () => {
    (component as any).onNameChange('Single');
    expect(miscService.updateField).toHaveBeenCalledWith((component as any).formData, 'name', 'Single');
    expect((component as any).nameError()).toBe('Name error');

    (component as any).onNameChange('Valid Name');
    expect((component as any).nameError()).toBe('');
  });

  it('should compute duplicateNameError for add mode and ignore own name in edit mode', () => {
    (component as any).formData.set({ ...(component as any).formData(), name: 'John Doe', countryName: 'Germany' });
    expect((component as any).duplicateNameError()).toBe(true);

    fixture.componentRef.setInput('editData', {
      id: 1,
      name: 'John Doe',
      countryCode: 'DE',
      countryName: 'Germany',
      sport: '',
      sportRawName: '',
      scoreType: null,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
      bestTime: ''
    });
    fixture.detectChanges();

    expect((component as any).duplicateNameError()).toBe(false);
  });

  it('should evaluate isFormValid for required fields, name error and duplicate name', () => {
    (component as any).formData.set({ ...(component as any).formData(), name: '', countryName: '' });
    expect((component as any).isFormValid()).toBe(false);

    (component as any).formData.set({ ...(component as any).formData(), name: 'Jane Doe', countryName: 'Germany' });
    (component as any).nameError.set('Name error');
    expect((component as any).isFormValid()).toBe(false);

    (component as any).nameError.set('');
    (component as any).formData.set({ ...(component as any).formData(), name: 'John Doe' });
    expect((component as any).isFormValid()).toBe(false);

    (component as any).formData.set({ ...(component as any).formData(), name: 'Jane Doe' });
    expect((component as any).isFormValid()).toBe(true);
  });

  it('should close modal with delay, reset state and emit closeModal', fakeAsync(() => {
    const closeSpy = jest.spyOn(component.closeModal, 'emit');
    (component as any).formData.set({ ...(component as any).formData(), name: 'Temp Name', countryName: 'Germany' });
    (component as any).nameError.set('temp error');

    (component as any).close();
    expect((component as any).isClosing()).toBe(true);

    tick(200);

    expect((component as any).isClosing()).toBe(false);
    expect((component as any).formData().name).toBe('');
    expect((component as any).formData().countryName).toBe('');
    expect((component as any).nameError()).toBe('');
    expect(closeSpy).toHaveBeenCalledTimes(1);
  }));

  it('should not submit when form is invalid', () => {
    const createSpy = jest.spyOn(athleteService, 'createAthlete');
    const updateSpy = jest.spyOn(component.updateAthlete, 'emit');

    (component as any).formData.set({ ...(component as any).formData(), name: '', countryName: '' });
    (component as any).onSubmit();

    expect(createSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should submit in edit mode, emit updateAthlete and close', fakeAsync(() => {
    fixture.componentRef.setInput('editData', {
      id: 1,
      name: 'John Doe',
      countryCode: 'DE',
      countryName: 'Germany',
      sport: '',
      sportRawName: '',
      scoreType: null,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
      bestTime: ''
    });
    fixture.detectChanges();

    (component as any).nameError.set('');
    (component as any).formData.set({ ...(component as any).formData(), name: 'John Doe', countryName: 'Germany' });

    const updateSpy = jest.spyOn(component.updateAthlete, 'emit');
    const closeSpy = jest.spyOn(component.closeModal, 'emit');

    (component as any).onSubmit();
    tick(200);

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'John Doe' }));
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(athleteService.createAthlete).not.toHaveBeenCalled();
  }));

  it('should create athlete successfully, patch store, show success and emit athleteCreated', fakeAsync(() => {
    const createdAthlete = { id: 10, firstName: 'Jane', lastName: 'Doe' } as any;
    jest.spyOn(athleteService, 'createAthlete').mockReturnValue(defer(() => Promise.resolve(createdAthlete)));
    const patchSpy = jest.spyOn(athleteService, 'patchAthleteAdd');
    const successSpy = jest.spyOn(alertService, 'success');
    const createdSpy = jest.spyOn(component.athleteCreated, 'emit');
    const closeSpy = jest.spyOn(component.closeModal, 'emit');

    (component as any).formData.set({
      ...(component as any).formData(),
      name: 'Jane Doe',
      countryName: 'Germany'
    });

    (component as any).onSubmit();
    tick();
    tick(200);

    expect(athleteService.createAthlete).toHaveBeenCalledWith({ firstName: 'Jane', lastName: 'Doe', countryId: 99 });
    expect(patchSpy).toHaveBeenCalledWith(createdAthlete);
    expect(successSpy).toHaveBeenCalledWith('Added Jane Doe');
    expect(createdSpy).toHaveBeenCalledWith(createdAthlete);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  }));

  it('should fallback lastName to empty string when only one name part is provided', fakeAsync(() => {
    jest.spyOn(athleteService, 'createAthlete').mockReturnValue(
      defer(() => Promise.resolve({ id: 11, firstName: 'Single', lastName: '' } as any))
    );

    (component as any).formData.set({
      ...(component as any).formData(),
      name: 'Single',
      countryName: 'Germany'
    });

    (component as any).onSubmit();
    tick();
    tick(200);

    expect(athleteService.createAthlete).toHaveBeenCalledWith({
      firstName: 'Single',
      lastName: '',
      countryId: 99
    });
  }));

  it('should fallback countryId to 0 when selected country is not found in data holder', fakeAsync(() => {
    jest.spyOn(athleteService, 'createAthlete').mockReturnValue(
      defer(() => Promise.resolve({ id: 12, firstName: 'Jane', lastName: 'Doe' } as any))
    );

    (component as any).formData.set({
      ...(component as any).formData(),
      name: 'Jane Doe',
      countryName: 'Unknownland'
    });

    (component as any).onSubmit();
    tick();
    tick(200);

    expect(athleteService.createAthlete).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Doe',
      countryId: 0
    });
  }));

  it('should fallback firstName and lastName to empty strings when submit is forced with blank name', fakeAsync(() => {
    jest.spyOn(component as any, 'isFormValid').mockReturnValue(true);
    jest.spyOn(athleteService, 'createAthlete').mockReturnValue(
      defer(() => Promise.resolve({ id: 13, firstName: '', lastName: '' } as any))
    );

    (component as any).formData.set({
      ...(component as any).formData(),
      name: '   ',
      countryName: 'Germany'
    });

    (component as any).onSubmit();
    tick();
    tick(200);

    expect(athleteService.createAthlete).toHaveBeenCalledWith({
      firstName: '',
      lastName: '',
      countryId: 99
    });
  }));

  it('should handle create athlete error and show translated error alert', fakeAsync(() => {
    jest.spyOn(athleteService, 'createAthlete').mockReturnValue(
      defer(() => Promise.reject({ status: 500 } as any))
    );
    const errorSpy = jest.spyOn(alertService, 'error');
    const createdSpy = jest.spyOn(component.athleteCreated, 'emit');
    const closeSpy = jest.spyOn(component.closeModal, 'emit');

    (component as any).formData.set({
      ...(component as any).formData(),
      name: 'Jane Doe',
      countryName: 'Germany'
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    (component as any).onSubmit();
    tick();

    expect(errorSpy).toHaveBeenCalledWith('Add failed Jane Doe');
    expect(createdSpy).not.toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  }));
});
