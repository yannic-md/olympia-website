import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import { ModalCountryComponent } from './modal-country.component';
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {CountryForm, CountryStats, V2Country} from "../../../../types/Country";
import {CountryService} from "../../../../services/api/country/country.service";
import {AlertService} from "../../../../services/api/alert/alert.service";
import {DataHolderService} from "../../../../services/data-holder/data-holder.service";
import {defer} from "rxjs";
import {HttpErrorResponse} from "@angular/common/http";

describe('ModalCountryComponent', () => {
  let component: ModalCountryComponent;
  let fixture: ComponentFixture<ModalCountryComponent>;
  let countryService: CountryService;
  let alertService: AlertService;
  let dataService: DataHolderService;
  let translateService: TranslateService;

  const mockCountries: CountryStats[] = [
    { countryId: 1, countryCode: 'US', countryName: 'United States', medals: { gold: 10, silver: 5, bronze: 3 }, nameEn: 'United States', nameDe: 'Vereinigte Staaten', nameFr: 'États-Unis' },
    { countryId: 2, countryCode: 'DE', countryName: 'Germany', medals: { gold: 8, silver: 7, bronze: 6 }, nameEn: 'Germany', nameDe: 'Deutschland', nameFr: 'Allemagne' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCountryComponent, HttpClientTestingModule, TranslateModule.forRoot({})],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCountryComponent);
    component = fixture.componentInstance;
    countryService = TestBed.inject(CountryService);
    alertService = TestBed.inject(AlertService);
    dataService = TestBed.inject(DataHolderService);
    translateService = TestBed.inject(TranslateService);

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('existingCountries', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form data in add mode', () => {
    expect(component['formData']()).toEqual({
      countryCode: '', countryName: '', goldMedals: 0, silverMedals: 0, bronzeMedals: 0,
      translate: false, nameDe: '', nameFr: ''
    });
    expect(component['isEditMode']()).toBe(false);
    expect(component['translateMode']()).toBe(false);
  });

  it('should set form data when editData is provided', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'FR', countryName: 'France', goldMedals: 5, silverMedals: 3, bronzeMedals: 2,
      translate: true, nameDe: 'Frankreich', nameFr: 'France'
    };

    fixture.componentRef.setInput('editData', editData);
    fixture.detectChanges();
    tick();

    expect(component['formData']().countryCode).toBe('FR');
    expect(component['formData']().countryName).toBe('France');
    expect(component['isEditMode']()).toBe(true);
    expect(component['translateMode']()).toBe(true);
  }));

  it('should set translateMode to false when editData has translate undefined or false', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'IT', countryName: 'Italy', goldMedals: 1, silverMedals: 2, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    fixture.detectChanges();
    tick();

    expect(component['translateMode']()).toBe(false);
  }));

  it('should set translateMode to false when editData has translate explicitly undefined', fakeAsync(() => {
    const editData: any = {
      countryCode: 'IT', countryName: 'Italy', goldMedals: 1, silverMedals: 2, bronzeMedals: 3,
      translate: undefined, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    fixture.detectChanges();
    tick();

    expect(component['translateMode']()).toBe(false);
  }));

  it('should detect code too short when code length is 1', () => {
    component['formData'].set({ ...component['formData'](), countryCode: 'A' });
    expect(component['codeTooShort']()).toBe(true);
  });

  it('should not detect code too short when code length is 2 or more', () => {
    component['formData'].set({ ...component['formData'](), countryCode: 'AB' });
    expect(component['codeTooShort']()).toBe(false);
  });

  it('should detect duplicate country code in add mode', () => {
    fixture.componentRef.setInput('existingCountries', mockCountries);
    fixture.detectChanges();

    component['formData'].set({ ...component['formData'](), countryCode: 'US', countryName: 'Test' });

    const duplicate = component['duplicateError']();
    expect(duplicate).not.toBeNull();
    expect(duplicate?.code).toBe(true);
  });

  it('should detect duplicate country name in add mode', () => {
    fixture.componentRef.setInput('existingCountries', mockCountries);
    fixture.detectChanges();

    component['formData'].set({ ...component['formData'](), countryCode: 'XX', countryName: 'United States' });

    const duplicate = component['duplicateError']();
    expect(duplicate).not.toBeNull();
    expect(duplicate?.name).toBe(true);
  });

  it('should detect duplicate nameDe and nameFr in translate mode', () => {
    fixture.componentRef.setInput('existingCountries', mockCountries);
    fixture.detectChanges();

    component['translateMode'].set(true);
    component['formData'].set({ ...component['formData'](), countryCode: 'XX', countryName: 'Test', nameDe: 'Deutschland', nameFr: 'Test' });

    const duplicate = component['duplicateError']();
    expect(duplicate).not.toBeNull();
    expect(duplicate?.nameDe).toBe(true);
  });

  it('should handle duplicate detection when existing countries have undefined optional name fields', () => {
    const countriesWithoutTranslations: CountryStats[] = [
      { countryId: 1, countryCode: 'US', countryName: 'United States', medals: { gold: 10, silver: 5, bronze: 3 }, nameEn: undefined, nameDe: undefined, nameFr: undefined }
    ];

    fixture.componentRef.setInput('existingCountries', countriesWithoutTranslations);
    fixture.detectChanges();

    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy' });

    expect(component['duplicateError']()).toBeNull();
  });

  it('should normalize undefined nameDe and nameFr fields in formData when checking duplicates', () => {
    const countriesWithTranslations: CountryStats[] = [
      { countryId: 1, countryCode: 'US', countryName: 'United States', medals: { gold: 10, silver: 5, bronze: 3 }, nameEn: 'United States', nameDe: 'Vereinigte Staaten', nameFr: 'États-Unis' }
    ];

    fixture.componentRef.setInput('existingCountries', countriesWithTranslations);
    fixture.detectChanges();

    component['formData'].set({ countryCode: 'IT', countryName: 'Italy', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, translate: false, nameDe: undefined, nameFr: undefined });

    expect(component['duplicateError']()).toBeNull();
  });

  it('should not detect duplicates in edit mode', () => {
    fixture.componentRef.setInput('existingCountries', mockCountries);
    fixture.componentRef.setInput('editData', { countryCode: 'US', countryName: 'United States', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, translate: false, nameDe: '', nameFr: '' });
    fixture.detectChanges();

    component['formData'].set({ ...component['formData'](), countryCode: 'US', countryName: 'United States' });

    expect(component['duplicateError']()).toBeNull();
  });

  it('should validate form correctly when all required fields are filled', () => {
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy' });
    expect(component['isFormValid']()).toBe(true);
  });

  it('should invalidate form when countryName is empty', () => {
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: '' });
    expect(component['isFormValid']()).toBe(false);
  });

  it('should invalidate form when countryCode is empty', () => {
    component['formData'].set({ ...component['formData'](), countryCode: '', countryName: 'Italy' });
    expect(component['isFormValid']()).toBe(false);
  });

  it('should invalidate form when code is too short', () => {
    component['formData'].set({ ...component['formData'](), countryCode: 'I', countryName: 'Italy' });
    expect(component['isFormValid']()).toBe(false);
  });

  it('should invalidate form when duplicate exists', () => {
    fixture.componentRef.setInput('existingCountries', mockCountries);
    fixture.detectChanges();

    component['formData'].set({ ...component['formData'](), countryCode: 'US', countryName: 'Test' });
    expect(component['isFormValid']()).toBe(false);
  });

  it('should invalidate form in translate mode when nameDe or nameFr is empty', () => {
    component['translateMode'].set(true);
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy', nameDe: '', nameFr: '' });
    expect(component['isFormValid']()).toBe(false);
  });

  it('should invalidate form in translate mode when nameDe or nameFr is undefined', () => {
    component['translateMode'].set(true);
    component['formData'].set({ countryCode: 'IT', countryName: 'Italy', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, translate: true, nameDe: undefined, nameFr: undefined });
    expect(component['isFormValid']()).toBe(false);
  });

  it('should invalidate form in translate mode when only nameFr is undefined', () => {
    component['translateMode'].set(true);
    component['formData'].set({ countryCode: 'IT', countryName: 'Italy', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, translate: true, nameDe: 'Italien', nameFr: undefined });
    expect(component['isFormValid']()).toBe(false);
  });

  it('should validate form in translate mode when all translation fields are filled', () => {
    component['translateMode'].set(true);
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy', nameDe: 'Italien', nameFr: 'Italie' });
    expect(component['isFormValid']()).toBe(true);
  });

  it('should activate translate mode and move current name to German translation when language is de', () => {
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');
    component['formData'].set({ ...component['formData'](), countryName: 'Deutschland' });

    component['onTranslateModeChange'](true);

    expect(component['translateMode']()).toBe(true);
    expect(component['formData']().countryName).toBe('');
    expect(component['formData']().nameDe).toBe('Deutschland');
  });

  it('should activate translate mode and move current name to French translation when language is fr', () => {
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('fr');
    component['formData'].set({ ...component['formData'](), countryName: 'France' });

    component['onTranslateModeChange'](true);

    expect(component['translateMode']()).toBe(true);
    expect(component['formData']().countryName).toBe('');
    expect(component['formData']().nameFr).toBe('France');
  });

  it('should activate translate mode without moving name when language is en', () => {
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
    component['formData'].set({ ...component['formData'](), countryName: 'England' });

    component['onTranslateModeChange'](true);

    expect(component['translateMode']()).toBe(true);
    expect(component['formData']().countryName).toBe('England');
  });

  it('should activate translate mode without moving name when currentName is empty', () => {
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');
    component['formData'].set({ ...component['formData'](), countryName: '' });

    component['onTranslateModeChange'](true);

    expect(component['translateMode']()).toBe(true);
    expect(component['formData']().countryName).toBe('');
    expect(component['formData']().nameDe).toBe('');
  });

  it('should deactivate translate mode and clear translation fields with animation delay', fakeAsync(() => {
    component['translateMode'].set(true);
    component['formData'].set({ ...component['formData'](), nameDe: 'Test', nameFr: 'Test' });

    component['onTranslateModeChange'](false);

    expect(component['isTranslateClosing']()).toBe(true);
    tick(250);

    expect(component['isTranslateClosing']()).toBe(false);
    expect(component['translateMode']()).toBe(false);
    expect(component['formData']().nameDe).toBe('');
    expect(component['formData']().nameFr).toBe('');
  }));

  it('should close modal, reset form and emit closeModal event', fakeAsync(() => {
    const closeSpy = jest.spyOn(component['closeModal'], 'emit');
    component['formData'].set({ countryCode: 'IT', countryName: 'Italy', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, translate: false, nameDe: '', nameFr: '' });

    component['close']();

    expect(component['isClosing']()).toBe(true);
    tick(200);

    expect(component['isClosing']()).toBe(false);
    expect(component['formData']().countryCode).toBe('');
    expect(component['formData']().countryName).toBe('');
    expect(closeSpy).toHaveBeenCalled();
  }));

  it('should not submit when duplicate error exists', () => {
    fixture.componentRef.setInput('existingCountries', mockCountries);
    fixture.detectChanges();

    const createSpy = jest.spyOn(countryService, 'createCountry');
    component['formData'].set({ ...component['formData'](), countryCode: 'US', countryName: 'Test' });

    component['onSubmit']();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('should not submit when already saving', () => {
    component['isSaving'].set(true);
    const createSpy = jest.spyOn(countryService, 'createCountry');

    component['onSubmit']();

    expect(createSpy).not.toHaveBeenCalled();
  });

  it('should create country successfully without translations', fakeAsync(() => {
    const mockCreated: V2Country = {
      id: 3, code: 'IT', name: 'Italy', nameEn: 'Italy', nameDe: undefined, nameFr: undefined,
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 }, leaderboardRank: 0, athletes: []
    };

    jest.spyOn(countryService, 'createCountry').mockReturnValue(defer(() => Promise.resolve(mockCreated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] added successfully');
    const alertSpy = jest.spyOn(alertService, 'success');
    const createdSpy = jest.spyOn(component['countryCreated'], 'emit');
    const closeSpy = jest.spyOn(component as any, 'close');

    dataService.countriesData.set([]);
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy' });
    component['onSubmit']();

    expect(component['isSaving']()).toBe(true);
    tick();

    expect(countryService.createCountry).toHaveBeenCalledWith({ code: 'IT', name: 'Italy' });
    expect(dataService.countriesData().length).toBe(1);
    expect(dataService.countriesData()[0].countryCode).toBe('IT');
    expect(alertSpy).toHaveBeenCalled();
    expect(createdSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
    expect(component['isSaving']()).toBe(false);
  }));

  it('should create country successfully with translations in German', fakeAsync(() => {
    const mockCreated: V2Country = {
      id: 3, code: 'IT', name: 'Italy', nameEn: 'Italy', nameDe: 'Italien', nameFr: 'Italie',
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 }, leaderboardRank: 0, athletes: []
    };

    jest.spyOn(countryService, 'createCountry').mockReturnValue(defer(() => Promise.resolve(mockCreated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] added successfully');
    const alertSpy = jest.spyOn(alertService, 'success');

    dataService.countriesData.set([]);
    component['translateMode'].set(true);
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy', nameDe: 'Italien', nameFr: 'Italie' });
    component['onSubmit']();

    tick();

    expect(countryService.createCountry).toHaveBeenCalledWith({
      code: 'IT', name: 'Italy', nameEn: 'Italy', nameDe: 'Italien', nameFr: 'Italie'
    });
    expect(dataService.countriesData()[0].countryName).toBe('Italien');
    expect(alertSpy).toHaveBeenCalled();
  }));

  it('should create country successfully with translations in French', fakeAsync(() => {
    const mockCreated: V2Country = {
      id: 3, code: 'IT', name: 'Italy', nameEn: 'Italy', nameDe: 'Italien', nameFr: 'Italie',
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 }, leaderboardRank: 0, athletes: []
    };

    jest.spyOn(countryService, 'createCountry').mockReturnValue(defer(() => Promise.resolve(mockCreated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('fr');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] added successfully');

    dataService.countriesData.set([]);
    component['translateMode'].set(true);
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy', nameDe: 'Italien', nameFr: 'Italie' });
    component['onSubmit']();

    tick();

    expect(dataService.countriesData()[0].countryName).toBe('Italie');
  }));

  it('should create country with fallback to base name when German translation is missing', fakeAsync(() => {
    const mockCreated: V2Country = {
      id: 3, code: 'IT', name: 'Italy', nameEn: 'Italy', nameDe: undefined, nameFr: 'Italie',
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 }, leaderboardRank: 0, athletes: []
    };

    jest.spyOn(countryService, 'createCountry').mockReturnValue(defer(() => Promise.resolve(mockCreated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] added successfully');

    dataService.countriesData.set([]);
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy' });
    component['onSubmit']();

    tick();

    expect(dataService.countriesData()[0].countryName).toBe('Italy');
  }));

  it('should create country with fallback to base name when French translation is missing', fakeAsync(() => {
    const mockCreated: V2Country = {
      id: 3, code: 'IT', name: 'Italy', nameEn: 'Italy', nameDe: 'Italien', nameFr: undefined,
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 }, leaderboardRank: 0, athletes: []
    };

    jest.spyOn(countryService, 'createCountry').mockReturnValue(defer(() => Promise.resolve(mockCreated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('fr');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] added successfully');

    dataService.countriesData.set([]);
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy' });
    component['onSubmit']();

    tick();

    expect(dataService.countriesData()[0].countryName).toBe('Italy');
  }));

  it('should create country with fallback to base name when English translation is missing', fakeAsync(() => {
    const mockCreated: V2Country = {
      id: 3, code: 'IT', name: 'Italy', nameEn: undefined, nameDe: 'Italien', nameFr: 'Italie',
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 }, leaderboardRank: 0, athletes: []
    };

    jest.spyOn(countryService, 'createCountry').mockReturnValue(defer(() => Promise.resolve(mockCreated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] added successfully');

    dataService.countriesData.set([]);
    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy' });
    component['onSubmit']();

    tick();

    expect(dataService.countriesData()[0].countryName).toBe('Italy');
  }));

  it('should handle error when creating country fails with 409 status', fakeAsync(() => {
    const mockError = new HttpErrorResponse({ status: 409, statusText: 'Conflict' });

    jest.spyOn(countryService, 'createCountry').mockReturnValue(defer(() => Promise.reject(mockError)));
    const alertSpy = jest.spyOn(alertService, 'error');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy' });
    component['onSubmit']();

    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error creating country:', mockError);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(component['isSaving']()).toBe(false);

    consoleSpy.mockRestore();
  }));

  it('should handle error when creating country fails with non-409 status', fakeAsync(() => {
    const mockError = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });

    jest.spyOn(countryService, 'createCountry').mockReturnValue(defer(() => Promise.reject(mockError)));
    jest.spyOn(translateService, 'instant').mockReturnValue('Error adding country [name]');
    const alertSpy = jest.spyOn(alertService, 'error');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    component['formData'].set({ ...component['formData'](), countryCode: 'IT', countryName: 'Italy' });
    component['onSubmit']();

    tick();

    expect(alertSpy).toHaveBeenCalled();
    expect(component['isSaving']()).toBe(false);

    consoleSpy.mockRestore();
  }));

  it('should update country successfully without translations', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'US', countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    dataService.athletes.set([{ id: 1, firstName: 'John', lastName: 'Doe', country: { id: 1, code: 'US', name: 'United States' } } as any]);
    dataService.sports.set([{ id: 1, name: 'Swimming', participants: [{ countryId: 1, countryCode: 'US', countryName: 'United States' }] } as any]);
    fixture.detectChanges();
    tick();

    const mockUpdated: V2Country = {
      id: 1, code: 'USA', name: 'USA', nameEn: 'USA', nameDe: undefined, nameFr: undefined,
      medals: { gold: 10, silver: 5, bronze: 3, total: 18 }, leaderboardRank: 1, athletes: []
    };
    jest.spyOn(countryService, 'updateCountry').mockReturnValue(defer(() => Promise.resolve(mockUpdated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] updated successfully');
    const alertSpy = jest.spyOn(alertService, 'success');
    const updatedSpy = jest.spyOn(component['countryUpdated'], 'emit');
    const closeSpy = jest.spyOn(component as any, 'close');

    component['formData'].set({ ...component['formData'](), countryCode: 'USA', countryName: 'USA' });
    component['onSubmit']();

    tick();

    expect(countryService.updateCountry).toHaveBeenCalledWith(1, {
      code: 'USA', name: 'USA', nameEn: null, nameDe: null, nameFr: null
    });
    expect(dataService.countriesData()[0].countryCode).toBe('USA');
    expect(dataService.athletes()[0].country?.code).toBe('USA');
    expect(dataService.sports()[0].participants[0].countryCode).toBe('USA');
    expect(alertSpy).toHaveBeenCalled();
    expect(updatedSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
    expect(component['isSaving']()).toBe(false);
  }));

  it('should update country successfully with translations in German', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'US', countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    dataService.athletes.set([]);
    dataService.sports.set([]);
    fixture.detectChanges();
    tick();

    const mockUpdated: V2Country = {
      id: 1, code: 'USA', name: 'USA', nameEn: 'USA', nameDe: 'Vereinigte Staaten', nameFr: 'États-Unis',
      medals: { gold: 10, silver: 5, bronze: 3, total: 18 }, leaderboardRank: 1, athletes: []
    };
    jest.spyOn(countryService, 'updateCountry').mockReturnValue(defer(() => Promise.resolve(mockUpdated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] updated successfully');

    component['translateMode'].set(true);
    component['formData'].set({ ...component['formData'](), countryCode: 'USA', countryName: 'USA', nameDe: 'Vereinigte Staaten', nameFr: 'États-Unis' });
    component['onSubmit']();

    tick();

    expect(countryService.updateCountry).toHaveBeenCalledWith(1, {
      code: 'USA', name: 'USA', nameEn: 'USA', nameDe: 'Vereinigte Staaten', nameFr: 'États-Unis'
    });
    expect(dataService.countriesData()[0].countryName).toBe('Vereinigte Staaten');
  }));

  it('should update country with fallback displayName when nameDe is undefined in translate mode', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'US', countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    dataService.athletes.set([]);
    dataService.sports.set([]);
    fixture.detectChanges();
    tick();

    const mockUpdated: V2Country = {
      id: 1, code: 'USA', name: 'USA', nameEn: 'USA', nameDe: undefined, nameFr: 'États-Unis',
      medals: { gold: 10, silver: 5, bronze: 3, total: 18 }, leaderboardRank: 1, athletes: []
    };
    jest.spyOn(countryService, 'updateCountry').mockReturnValue(defer(() => Promise.resolve(mockUpdated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] updated successfully');

    component['translateMode'].set(true);
    component['formData'].set({ countryCode: 'USA', countryName: 'USA', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, translate: true, nameDe: undefined, nameFr: 'États-Unis' });
    component['onSubmit']();

    tick();

    expect(dataService.countriesData()[0].countryName).toBe('USA');
  }));

  it('should update country with fallback displayName when nameFr is undefined in translate mode', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'US', countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    dataService.athletes.set([]);
    dataService.sports.set([]);
    fixture.detectChanges();
    tick();

    const mockUpdated: V2Country = {
      id: 1, code: 'USA', name: 'USA', nameEn: 'USA', nameDe: 'Vereinigte Staaten', nameFr: undefined,
      medals: { gold: 10, silver: 5, bronze: 3, total: 18 }, leaderboardRank: 1, athletes: []
    };
    jest.spyOn(countryService, 'updateCountry').mockReturnValue(defer(() => Promise.resolve(mockUpdated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('fr');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] updated successfully');

    component['translateMode'].set(true);
    component['formData'].set({ countryCode: 'USA', countryName: 'USA', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, translate: true, nameDe: 'Vereinigte Staaten', nameFr: undefined });
    component['onSubmit']();

    tick();

    expect(dataService.countriesData()[0].countryName).toBe('USA');
  }));

  it('should update country and handle undefined optional translation fields in updatedCountry object', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'US', countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    dataService.athletes.set([]);
    dataService.sports.set([]);
    fixture.detectChanges();
    tick();

    const mockUpdated: V2Country = {
      id: 1, code: 'USA', name: 'USA', nameEn: 'USA', nameDe: undefined, nameFr: undefined,
      medals: { gold: 10, silver: 5, bronze: 3, total: 18 }, leaderboardRank: 1, athletes: []
    };
    jest.spyOn(countryService, 'updateCountry').mockReturnValue(defer(() => Promise.resolve(mockUpdated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] updated successfully');

    component['translateMode'].set(true);
    component['formData'].set({ countryCode: 'USA', countryName: 'USA', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, translate: true, nameDe: undefined, nameFr: undefined });
    component['onSubmit']();

    tick();

    const updated = dataService.countriesData()[0];
    expect(updated.nameDe).toBe(undefined);
    expect(updated.nameFr).toBe(undefined);
  }));

  it('should update country lists with athletes and sports having no matching country', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'US', countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    dataService.athletes.set([
      { id: 1, firstName: 'John', lastName: 'Doe', country: { id: 1, code: 'US', name: 'United States' } } as any,
      { id: 2, firstName: 'Jane', lastName: 'Smith', country: { id: 2, code: 'DE', name: 'Germany' } } as any
    ]);
    dataService.sports.set([
      { id: 1, name: 'Swimming', participants: [
        { countryId: 1, countryCode: 'US', countryName: 'United States' },
        { countryId: 2, countryCode: 'DE', countryName: 'Germany' }
      ] } as any
    ]);
    fixture.detectChanges();
    tick();

    const mockUpdated: V2Country = {
      id: 1, code: 'USA', name: 'USA', nameEn: 'USA', nameDe: undefined, nameFr: undefined,
      medals: { gold: 10, silver: 5, bronze: 3, total: 18 }, leaderboardRank: 1, athletes: []
    };
    jest.spyOn(countryService, 'updateCountry').mockReturnValue(defer(() => Promise.resolve(mockUpdated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] updated successfully');

    component['formData'].set({ ...component['formData'](), countryCode: 'USA', countryName: 'USA' });
    component['onSubmit']();

    tick();

    expect(dataService.athletes()[0].country?.code).toBe('USA');
    expect(dataService.athletes()[1].country?.code).toBe('DE');
    expect(dataService.sports()[0].participants[0].countryCode).toBe('USA');
    expect(dataService.sports()[0].participants[1].countryCode).toBe('DE');
  }));

  it('should update country lists with athletes having undefined country', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'US', countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    dataService.athletes.set([
      { id: 1, firstName: 'John', lastName: 'Doe', country: undefined } as any,
      { id: 2, firstName: 'Jane', lastName: 'Smith', country: { id: 1, code: 'US', name: 'United States' } } as any
    ]);
    dataService.sports.set([]);
    fixture.detectChanges();
    tick();

    const mockUpdated: V2Country = {
      id: 1, code: 'USA', name: 'USA', nameEn: 'USA', nameDe: undefined, nameFr: undefined,
      medals: { gold: 10, silver: 5, bronze: 3, total: 18 }, leaderboardRank: 1, athletes: []
    };
    jest.spyOn(countryService, 'updateCountry').mockReturnValue(defer(() => Promise.resolve(mockUpdated)));
    jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
    jest.spyOn(translateService, 'instant').mockReturnValue('Country [name] updated successfully');

    component['formData'].set({ ...component['formData'](), countryCode: 'USA', countryName: 'USA' });
    component['onSubmit']();

    tick();

    expect(dataService.athletes()[0].country).toBe(undefined);
    expect(dataService.athletes()[1].country?.code).toBe('USA');
  }));

  it('should not update country when existing country is not found', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'XX', countryName: 'Unknown', goldMedals: 0, silverMedals: 0, bronzeMedals: 0,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    fixture.detectChanges();
    tick();

    const updateSpy = jest.spyOn(countryService, 'updateCountry');
    component['formData'].set({ ...component['formData'](), countryCode: 'YY', countryName: 'Test' });
    component['onSubmit']();

    tick();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(component['isSaving']()).toBe(false);
  }));

  it('should handle update when editData countryCode is undefined', fakeAsync(() => {
    const editData: any = {
      countryCode: undefined, countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    tick();

    const updateSpy = jest.spyOn(countryService, 'updateCountry');

    component['formData'].set({ ...component['formData'](), countryCode: 'USA', countryName: 'USA' });
    component['onSubmit']();

    tick();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(component['isSaving']()).toBe(false);
  }));

  it('should handle error when updating country fails', fakeAsync(() => {
    const editData: CountryForm = {
      countryCode: 'US', countryName: 'United States', goldMedals: 10, silverMedals: 5, bronzeMedals: 3,
      translate: false, nameDe: '', nameFr: ''
    };
    const mockError = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });

    fixture.componentRef.setInput('editData', editData);
    dataService.countriesData.set([...mockCountries]);
    fixture.detectChanges();
    tick();

    jest.spyOn(countryService, 'updateCountry').mockReturnValue(defer(() => Promise.reject(mockError)));
    jest.spyOn(translateService, 'instant').mockReturnValue('Error updating country [name]');
    const alertSpy = jest.spyOn(alertService, 'error');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    component['formData'].set({ ...component['formData'](), countryCode: 'USA', countryName: 'USA' });
    component['onSubmit']();

    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error updating country:', mockError);
    expect(alertSpy).toHaveBeenCalled();
    expect(component['isSaving']()).toBe(false);

    consoleSpy.mockRestore();
  }));
});
