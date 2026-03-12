import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { CountryViewComponent } from "./country-view.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { DataHolderService } from "../../../../services/data-holder/data-holder.service";
import { AlertService } from "../../../../services/api/alert/alert.service";
import { CountryService } from "../../../../services/api/country/country.service";
import { CountryStats } from "../../../../types/Country";
import { V2Athlete } from "../../../../types/Athlete";
import { V2Sport } from "../../../../types/Disciplines";
import { defer } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";

describe('CountryViewComponent', () => {
  let component: CountryViewComponent;
  let fixture: ComponentFixture<CountryViewComponent>;
  let dataHolderService: DataHolderService;
  let countryService: CountryService;
  let alertService: AlertService;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryViewComponent, HttpClientTestingModule, TranslateModule.forRoot()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(CountryViewComponent);
    component = fixture.componentInstance;
    dataHolderService = TestBed.inject(DataHolderService);
    countryService = TestBed.inject(CountryService);
    alertService = TestBed.inject(AlertService);
    translateService = TestBed.inject(TranslateService);

    fixture.componentRef.setInput('filterCountry', 'all');
    fixture.componentRef.setInput('filterMedal', 'all');
    fixture.componentRef.setInput('searchQuery', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('signals initialization', () => {
    it('should initialize with default values', () => {
      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['editingCountry']()).toBeNull();
      expect(component['expandedCountries']().size).toBe(0);
    });
  });

  describe('countryEditData computed signal', () => {
    it('should return null when editingCountry is null', () => {
      component['editingCountry'].set(null);
      expect(component['countryEditData']()).toBeNull();
    });

    it('should transform country without translations', () => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'US',
        countryName: 'USA',
        medals: { gold: 5, silver: 3, bronze: 2 }
      };

      component['editingCountry'].set(mockCountry);

      const editData = component['countryEditData']();
      expect(editData).toEqual({
        countryCode: 'US',
        countryName: 'USA',
        goldMedals: 5,
        silverMedals: 3,
        bronzeMedals: 2,
        translate: false,
        nameDe: '',
        nameFr: ''
      });
    });

    it('should transform country with translations using nameEn', () => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'DE',
        countryName: 'Germany',
        medals: { gold: 10, silver: 8, bronze: 6 },
        nameEn: 'Germany',
        nameDe: 'Deutschland',
        nameFr: 'Allemagne'
      };

      component['editingCountry'].set(mockCountry);

      const editData = component['countryEditData']();
      expect(editData?.countryName).toBe('Germany');
      expect(editData?.translate).toBe(true);
      expect(editData?.nameDe).toBe('Deutschland');
      expect(editData?.nameFr).toBe('Allemagne');
    });

    it('should use countryName as fallback when nameEn is missing but has other translations', () => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'FR',
        countryName: 'France',
        medals: { gold: 7, silver: 5, bronze: 4 },
        nameDe: 'Frankreich',
        nameFr: 'France'
      };

      component['editingCountry'].set(mockCountry);

      const editData = component['countryEditData']();
      expect(editData?.countryName).toBe('France');
      expect(editData?.translate).toBe(true);
    });

    it('should handle undefined translation fields', () => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'XX',
        countryName: 'Test Country',
        medals: { gold: 1, silver: 0, bronze: 0 },
        nameEn: 'Test Country'
      };

      component['editingCountry'].set(mockCountry);

      const editData = component['countryEditData']();
      expect(editData?.nameDe).toBe('');
      expect(editData?.nameFr).toBe('');
    });
  });

  describe('sortedCountries computed signal', () => {
    it('should return all countries when filter is "all"', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } },
        { countryId: 2, countryCode: 'CN', countryName: 'China', medals: { gold: 4, silver: 4, bronze: 3 } }
      ];

      dataHolderService.countriesData.set(mockCountries);
      fixture.componentRef.setInput('filterCountry', 'all');

      const sorted = component['sortedCountries']();
      expect(sorted).toHaveLength(2);
    });

    it('should filter by specific country', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } },
        { countryId: 2, countryCode: 'CN', countryName: 'China', medals: { gold: 4, silver: 4, bronze: 3 } }
      ];

      dataHolderService.countriesData.set(mockCountries);
      fixture.componentRef.setInput('filterCountry', 'USA');

      const sorted = component['sortedCountries']();
      expect(sorted).toHaveLength(1);
      expect(sorted[0].countryName).toBe('USA');
    });

    it('should sort countries by medals', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 3, silver: 3, bronze: 2 } },
        { countryId: 2, countryCode: 'CN', countryName: 'China', medals: { gold: 5, silver: 4, bronze: 3 } }
      ];

      dataHolderService.countriesData.set(mockCountries);

      const sorted = component['sortedCountries']();
      expect(sorted[0].countryName).toBe('China');
      expect(sorted[1].countryName).toBe('USA');
    });
  });

  describe('filteredCountries computed signal', () => {
    it('should return all sorted countries when search is empty', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } }
      ];

      dataHolderService.countriesData.set(mockCountries);
      fixture.componentRef.setInput('searchQuery', '');

      const filtered = component['filteredCountries']();
      expect(filtered).toHaveLength(1);
    });

    it('should filter by country name', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } },
        { countryId: 2, countryCode: 'FR', countryName: 'France', medals: { gold: 4, silver: 4, bronze: 3 } }
      ];

      dataHolderService.countriesData.set(mockCountries);
      fixture.componentRef.setInput('searchQuery', 'france');

      const filtered = component['filteredCountries']();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].countryName).toBe('France');
    });

    it('should include country if athlete matches search query', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } }
      ];

      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.countriesData.set(mockCountries);
      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', 'john');

      const filtered = component['filteredCountries']();
      expect(filtered).toHaveLength(1);
    });

    it('should exclude country when neither country name nor athletes match', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } }
      ];

      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.countriesData.set(mockCountries);
      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', 'xyz');

      const filtered = component['filteredCountries']();
      expect(filtered).toHaveLength(0);
    });
  });

  describe('athletesForCountry', () => {
    it('should return all athletes for country when search is empty', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
          leaderboardRank: 1,
          results: []
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', '');

      const athletes = component['athletesForCountry'](1);
      expect(athletes).toHaveLength(2);
    });

    it('should filter athletes by wrong country', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);

      const athletes = component['athletesForCountry'](2);
      expect(athletes).toHaveLength(0);
    });

    it('should show all athletes when country name matches search', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } }
      ];

      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.countriesData.set(mockCountries);
      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', 'usa');

      const athletes = component['athletesForCountry'](1);
      expect(athletes).toHaveLength(1);
    });

    it('should filter athletes by name when country does not match search', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } }
      ];

      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 1, bronze: 0, total: 1 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.countriesData.set(mockCountries);
      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', 'john');

      const athletes = component['athletesForCountry'](1);
      expect(athletes).toHaveLength(1);
      expect(athletes[0].firstName).toBe('John');
    });

    it('should sort athletes by medals', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 2,
          results: []
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);

      const athletes = component['athletesForCountry'](1);
      expect(athletes[0].firstName).toBe('Jane');
      expect(athletes[1].firstName).toBe('John');
    });

    it('should handle country not found in countriesData', () => {
      dataHolderService.countriesData.set([]);
      dataHolderService.athletes.set([]);
      fixture.componentRef.setInput('searchQuery', 'test');

      const athletes = component['athletesForCountry'](999);
      expect(athletes).toHaveLength(0);
    });
  });

  describe('toggleCountry', () => {
    it('should not toggle when country has no athletes', () => {
      dataHolderService.athletes.set([]);

      component['toggleCountry'](1);

      expect(component['expandedCountries']().has(1)).toBe(false);
    });

    it('should add country to expanded set when not expanded', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);

      component['toggleCountry'](1);

      expect(component['expandedCountries']().has(1)).toBe(true);
    });

    it('should remove country from expanded set when already expanded', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      component['expandedCountries'].set(new Set([1]));

      component['toggleCountry'](1);

      expect(component['expandedCountries']().has(1)).toBe(false);
    });
  });

  describe('isCountryExpanded', () => {
    it('should return true when country is in expanded set', () => {
      component['expandedCountries'].set(new Set([1]));

      expect(component['isCountryExpanded'](1)).toBe(true);
    });

    it('should return false when no search query and not expanded', () => {
      fixture.componentRef.setInput('searchQuery', '');

      expect(component['isCountryExpanded'](1)).toBe(false);
    });

    it('should return false when country name matches search', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } }
      ];

      dataHolderService.countriesData.set(mockCountries);
      fixture.componentRef.setInput('searchQuery', 'usa');

      expect(component['isCountryExpanded'](1)).toBe(false);
    });

    it('should auto-expand when athlete matches search but not country name', () => {
      const mockCountries: CountryStats[] = [
        { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 5, silver: 3, bronze: 2 } }
      ];

      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.countriesData.set(mockCountries);
      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', 'john');

      expect(component['isCountryExpanded'](1)).toBe(true);
    });

    it('should handle country not found', () => {
      dataHolderService.countriesData.set([]);
      fixture.componentRef.setInput('searchQuery', 'test');

      expect(component['isCountryExpanded'](999)).toBe(false);
    });
  });

  describe('onEditCountry', () => {
    it('should set editing country and open modal', () => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'US',
        countryName: 'USA',
        medals: { gold: 5, silver: 3, bronze: 2 }
      };

      component['onEditCountry'](mockCountry);

      expect(component['editingCountry']()).toEqual(mockCountry);
      expect(component['isCountryModalOpen']()).toBe(true);
    });
  });

  describe('onDeleteCountry', () => {
    it('should not delete when country is not found', () => {
      dataHolderService.countriesData.set([]);
      const deleteSpy = jest.spyOn(countryService, 'deleteCountry');

      component['onDeleteCountry'](999);

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should delete country and update all stores on success', fakeAsync(() => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'US',
        countryName: 'USA',
        medals: { gold: 5, silver: 3, bronze: 2 }
      };

      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          country: { id: 2, code: 'FR', name: 'France' },
          medals: { gold: 0, silver: 1, bronze: 0, total: 1 },
          leaderboardRank: 2,
          results: []
        }
      ];

      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'swimming',
          name: 'Swimming',
          scoreType: 'TIME',
          participants: [
            { athleteId: 1, firstName: 'John', lastName: 'Doe', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 },
            { athleteId: 2, firstName: 'Jane', lastName: 'Smith', countryId: 2, countryCode: 'FR', countryName: 'France', medal: 'SILVER', result: '48.00', rank: 2, resultId: 2 }
          ]
        }
      ];

      dataHolderService.countriesData.set([mockCountry]);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.sports.set(mockSports);

      jest.spyOn(countryService, 'deleteCountry').mockReturnValue(defer(() => Promise.resolve()));
      jest.spyOn(translateService, 'instant').mockReturnValue('Deleted [name]');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onDeleteCountry'](1);

      tick();

      expect(dataHolderService.countriesData()).toHaveLength(0);
      expect(dataHolderService.athletes()).toHaveLength(1);
      expect(dataHolderService.athletes()[0].id).toBe(2);
      expect(dataHolderService.sports()[0].participants).toHaveLength(1);
      expect(dataHolderService.sports()[0].participants[0].countryId).toBe(2);
      expect(alertSpy).toHaveBeenCalled();
    }));

    it('should handle delete error', fakeAsync(() => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'US',
        countryName: 'USA',
        medals: { gold: 5, silver: 3, bronze: 2 }
      };

      const mockError = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' });

      dataHolderService.countriesData.set([mockCountry]);

      jest.spyOn(countryService, 'deleteCountry').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValue('Error deleting [name]');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component['onDeleteCountry'](1);

      tick();

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting country:', mockError);
      expect(alertSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    }));
  });

  describe('onCloseCountryModal', () => {
    it('should close modal and reset editing country', () => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'US',
        countryName: 'USA',
        medals: { gold: 5, silver: 3, bronze: 2 }
      };

      component['editingCountry'].set(mockCountry);
      component['isCountryModalOpen'].set(true);

      component['onCloseCountryModal']();

      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['editingCountry']()).toBeNull();
    });
  });
});


