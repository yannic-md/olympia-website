import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { AthleteViewComponent } from "./athlete-view.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { DataHolderService } from "../../../../services/data-holder/data-holder.service";
import { AlertService } from "../../../../services/api/alert/alert.service";
import { AthleteService } from "../../../../services/api/athlete/athlete.service";
import { V2Athlete } from "../../../../types/Athlete";
import { CountryStats } from "../../../../types/Country";
import { LeaderboardResponse } from "../../../../types/API";
import { defer } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";

describe('AthleteViewComponent', () => {
  let component: AthleteViewComponent;
  let fixture: ComponentFixture<AthleteViewComponent>;
  let dataHolderService: DataHolderService;
  let athleteService: AthleteService;
  let alertService: AlertService;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AthleteViewComponent, HttpClientTestingModule, TranslateModule.forRoot({})],
    })
      .compileComponents();

    fixture = TestBed.createComponent(AthleteViewComponent);
    component = fixture.componentInstance;
    dataHolderService = TestBed.inject(DataHolderService);
    athleteService = TestBed.inject(AthleteService);
    alertService = TestBed.inject(AlertService);
    translateService = TestBed.inject(TranslateService);

    fixture.componentRef.setInput('filterCountry', 'all');
    fixture.componentRef.setInput('filterSport', 'all');
    fixture.componentRef.setInput('filterMedal', 'all');
    fixture.componentRef.setInput('searchQuery', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('signals initialization', () => {
    it('should initialize with default values', () => {
      expect(component['suspendedAthleteForm']()).toBeNull();
      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['editingAthlete']()).toBeNull();
      expect(component['expandedAthletes']().size).toBe(0);
    });
  });

  describe('athleteEditData computed signal', () => {
    it('should return null when editingAthlete is null', () => {
      component['editingAthlete'].set(null);
      expect(component['athleteEditData']()).toBeNull();
    });

    it('should transform athlete to AthleteForm', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Swimming',
            sportRawName: 'swimming-100m',
            scoreType: 'TIME',
            result: '47.50',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      component['editingAthlete'].set(mockAthlete);

      const editData = component['athleteEditData']();
      expect(editData?.id).toBe(1);
      expect(editData?.name).toBe('John Doe');
      expect(editData?.countryCode).toBe('US');
      expect(editData?.countryName).toBe('USA');
      expect(editData?.sport).toBe('Swimming');
      expect(editData?.sportRawName).toBe('swimming-100m');
      expect(editData?.scoreType).toBe('TIME');
      expect(editData?.goldMedals).toBe(2);
      expect(editData?.silverMedals).toBe(1);
      expect(editData?.bronzeMedals).toBe(0);
      expect(editData?.bestTime).toBe('47.50');
    });

    it('should strip pts from result', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Test',
            sportRawName: 'test',
            scoreType: 'PTS',
            result: '100 pts',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      component['editingAthlete'].set(mockAthlete);

      const editData = component['athleteEditData']();
      expect(editData?.bestTime).toBe('100');
    });

    it('should strip wins and translated terms from result', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Test',
            sportRawName: 'test',
            scoreType: 'WINS',
            result: '5 Siege',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      component['editingAthlete'].set(mockAthlete);

      const editData = component['athleteEditData']();
      expect(editData?.bestTime).toBe('5');
    });

    it('should handle null country using nullish coalescing', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'No',
        lastName: 'Country',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      component['editingAthlete'].set(mockAthlete);

      const editData = component['athleteEditData']();
      expect(editData?.countryCode).toBe('');
      expect(editData?.countryName).toBe('');
    });

    it('should handle undefined or null results array', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: undefined as any
      };

      component['editingAthlete'].set(mockAthlete);

      const editData = component['athleteEditData']();
      expect(editData?.sport).toBe('');
      expect(editData?.sportRawName).toBe('');
      expect(editData?.bestTime).toBe('');
    });

    it('should handle null scoreType using nullish coalescing', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Test',
            sportRawName: 'test',
            scoreType: null,
            result: '100',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      component['editingAthlete'].set(mockAthlete);

      const editData = component['athleteEditData']();
      expect(editData?.scoreType).toBeNull();
    });
  });

  describe('sortedAthletes computed signal', () => {
    it('should return all athletes when filters are "all"', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);

      const sorted = component['sortedAthletes']();
      expect(sorted).toHaveLength(1);
    });

    it('should filter by country', () => {
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

      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('filterCountry', 'USA');

      const sorted = component['sortedAthletes']();
      expect(sorted).toHaveLength(1);
      expect(sorted[0].firstName).toBe('John');
    });

    it('should filter by sport', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: null,
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: [
            {
              sportId: 1,
              sportName: 'Swimming',
              sportRawName: 'swimming-100m',
              scoreType: 'TIME',
              result: '47.50',
              rank: 1,
              medal: 'GOLD'
            }
          ]
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          country: null,
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 2,
          results: [
            {
              sportId: 2,
              sportName: 'Running',
              sportRawName: 'running-100m',
              scoreType: 'TIME',
              result: '10.00',
              rank: 1,
              medal: 'GOLD'
            }
          ]
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('filterSport', 'swimming-100m');

      const sorted = component['sortedAthletes']();
      expect(sorted).toHaveLength(1);
      expect(sorted[0].firstName).toBe('John');
    });

    it('should sort athletes by medals', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: null,
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 2,
          results: []
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          country: null,
          medals: { gold: 3, silver: 2, bronze: 1, total: 6 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);

      const sorted = component['sortedAthletes']();
      expect(sorted[0].firstName).toBe('Jane');
      expect(sorted[1].firstName).toBe('John');
    });
  });

  describe('filteredAthletes computed signal', () => {
    it('should return all sorted athletes when search is empty', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: null,
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', '');

      const filtered = component['filteredAthletes']();
      expect(filtered).toHaveLength(1);
    });

    it('should filter by athlete name', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: null,
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          country: null,
          medals: { gold: 0, silver: 1, bronze: 0, total: 1 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', 'john');

      const filtered = component['filteredAthletes']();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].firstName).toBe('John');
    });

    it('should filter by country name', () => {
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
      fixture.componentRef.setInput('searchQuery', 'usa');

      const filtered = component['filteredAthletes']();
      expect(filtered).toHaveLength(1);
    });

    it('should handle null country name using nullish coalescing', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: null,
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      fixture.componentRef.setInput('searchQuery', 'john');

      const filtered = component['filteredAthletes']();
      expect(filtered).toHaveLength(1);
    });
  });

  describe('onDeleteAthlete', () => {
    it('should not delete when athlete is not found', () => {
      dataHolderService.athletes.set([]);
      const deleteSpy = jest.spyOn(athleteService, 'deleteAthlete');

      component['onDeleteAthlete'](999);

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should delete athlete and show success alert', fakeAsync(() => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([mockAthlete]);

      jest.spyOn(athleteService, 'deleteAthlete').mockReturnValue(defer(() => Promise.resolve()));
      const patchSpy = jest.spyOn(athleteService, 'patchAthleteDelete').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Deleted [name]');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onDeleteAthlete'](1);

      tick();

      expect(athleteService.deleteAthlete).toHaveBeenCalledWith(1);
      expect(patchSpy).toHaveBeenCalledWith(1, 1);
      expect(alertSpy).toHaveBeenCalled();
    }));

    it('should use 0 for countryId when country is null', fakeAsync(() => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([mockAthlete]);

      jest.spyOn(athleteService, 'deleteAthlete').mockReturnValue(defer(() => Promise.resolve()));
      const patchSpy = jest.spyOn(athleteService, 'patchAthleteDelete').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Deleted');
      jest.spyOn(alertService, 'success').mockImplementation();

      component['onDeleteAthlete'](1);

      tick();

      expect(patchSpy).toHaveBeenCalledWith(1, 0);
    }));

    it('should handle delete error', fakeAsync(() => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      const mockError = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' });

      dataHolderService.athletes.set([mockAthlete]);

      jest.spyOn(athleteService, 'deleteAthlete').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValue('Error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component['onDeleteAthlete'](1);

      tick();

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting athlete:', mockError);
      expect(alertSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    }));
  });

  describe('onAthleteCreated', () => {
    it('should close modal and reset state', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'New',
        lastName: 'Athlete',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      component['isAthleteModalOpen'].set(true);
      component['editingAthlete'].set(mockAthlete);
      component['suspendedAthleteForm'].set({ id: 1, name: 'Test', countryCode: '', countryName: '', sport: '', sportRawName: '', scoreType: null, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      component['onAthleteCreated'](mockAthlete);

      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['editingAthlete']()).toBeNull();
      expect(component['suspendedAthleteForm']()).toBeNull();
    });
  });

  describe('onUpdateAthlete', () => {
    it('should not update when form has no id', () => {
      const updateSpy = jest.spyOn(athleteService, 'updateAthlete');

      component['onUpdateAthlete']({ name: 'Test', countryCode: '', countryName: '', sport: '', sportRawName: '', scoreType: null, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should update athlete and close modal on success', fakeAsync(() => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      const mockCountry: CountryStats = {
        countryId: 2,
        countryCode: 'FR',
        countryName: 'France',
        medals: { gold: 0, silver: 0, bronze: 0 }
      };

      dataHolderService.athletes.set([mockAthlete]);
      dataHolderService.countriesData.set([mockCountry]);

      const updatedAthlete: V2Athlete = {
        ...mockAthlete,
        firstName: 'Jane',
        lastName: 'Smith',
        country: { id: 2, code: 'FR', name: 'France' }
      };

      jest.spyOn(athleteService, 'updateAthlete').mockReturnValue(defer(() => Promise.resolve(updatedAthlete)));
      const patchSpy = jest.spyOn(athleteService, 'patchAthleteUpdate').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Updated');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onUpdateAthlete']({ id: 1, name: 'Jane Smith', countryCode: 'FR', countryName: 'France', sport: '', sportRawName: '', scoreType: null, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      tick();

      expect(athleteService.updateAthlete).toHaveBeenCalledWith(1, { firstName: 'Jane', lastName: 'Smith', countryId: 2 });
      expect(patchSpy).toHaveBeenCalledWith(updatedAthlete, 1);
      expect(component['editingAthlete']()).toBeNull();
      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(alertSpy).toHaveBeenCalled();
    }));

    it('should use 0 for previousCountryId when athlete has no country', fakeAsync(() => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      const mockCountry: CountryStats = {
        countryId: 2,
        countryCode: 'FR',
        countryName: 'France',
        medals: { gold: 0, silver: 0, bronze: 0 }
      };

      dataHolderService.athletes.set([mockAthlete]);
      dataHolderService.countriesData.set([mockCountry]);

      const updatedAthlete: V2Athlete = {
        ...mockAthlete,
        country: { id: 2, code: 'FR', name: 'France' }
      };

      jest.spyOn(athleteService, 'updateAthlete').mockReturnValue(defer(() => Promise.resolve(updatedAthlete)));
      const patchSpy = jest.spyOn(athleteService, 'patchAthleteUpdate').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Updated');
      jest.spyOn(alertService, 'success').mockImplementation();

      component['onUpdateAthlete']({ id: 1, name: 'John Doe', countryCode: 'FR', countryName: 'France', sport: '', sportRawName: '', scoreType: null, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      tick();

      expect(patchSpy).toHaveBeenCalledWith(updatedAthlete, 0);
    }));

    it('should handle update error', fakeAsync(() => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

      dataHolderService.athletes.set([mockAthlete]);
      dataHolderService.countriesData.set([]);

      jest.spyOn(athleteService, 'updateAthlete').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValue('Error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component['onUpdateAthlete']({ id: 1, name: 'John Doe', countryCode: '', countryName: '', sport: '', sportRawName: '', scoreType: null, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      tick();

      expect(consoleSpy).toHaveBeenCalledWith('Error updating athlete:', mockError);
      expect(alertSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    }));
  });

  describe('onOpenCountryModalFromAthlete', () => {
    it('should suspend athlete form and open country modal', () => {
      const form = { id: 1, name: 'Test', countryCode: 'US', countryName: 'USA', sport: '', sportRawName: '', scoreType: null as any, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' };

      component['onOpenCountryModalFromAthlete'](form);

      expect(component['suspendedAthleteForm']()).toEqual(form);
      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['isCountryModalOpen']()).toBe(true);
    });
  });

  describe('onCountryCreated', () => {
    it('should close country modal and reset when suspended form is null', () => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'US',
        countryName: 'USA',
        medals: { gold: 0, silver: 0, bronze: 0 }
      };

      component['suspendedAthleteForm'].set(null);

      component['onCountryCreated'](mockCountry);

      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['suspendedAthleteForm']()).toBeNull();
    });

    it('should resume athlete modal with updated country', fakeAsync(() => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'FR',
        countryName: 'France',
        medals: { gold: 0, silver: 0, bronze: 0 }
      };

      const suspendedForm = { id: 1, name: 'Test', countryCode: '', countryName: '', sport: '', sportRawName: '', scoreType: null as any, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' };
      component['suspendedAthleteForm'].set(suspendedForm);

      component['onCountryCreated'](mockCountry);

      expect(component['isCountryModalOpen']()).toBe(false);

      tick(150);

      expect(component['suspendedAthleteForm']()?.countryName).toBe('France');
      expect(component['suspendedAthleteForm']()?.countryCode).toBe('FR');
      expect(component['isAthleteModalOpen']()).toBe(true);
    }));
  });

  describe('onCloseCountryModal', () => {
    it('should close modal and reopen athlete modal when suspended form exists', () => {
      component['suspendedAthleteForm'].set({ id: 1, name: 'Test', countryCode: '', countryName: '', sport: '', sportRawName: '', scoreType: null as any, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });
      component['isCountryModalOpen'].set(true);

      component['onCloseCountryModal']();

      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['isAthleteModalOpen']()).toBe(true);
    });

    it('should close modal and not reopen athlete modal when suspended form is null', () => {
      component['suspendedAthleteForm'].set(null);
      component['isCountryModalOpen'].set(true);

      component['onCloseCountryModal']();

      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['isAthleteModalOpen']()).toBe(false);
    });
  });

  describe('resultsForAthlete', () => {
    it('should return empty array when leaderboardData is null', () => {
      dataHolderService.leaderboardData.set(null);

      const results = component['resultsForAthlete'](1);

      expect(results).toEqual([]);
    });

    it('should return empty array when athlete is not found', () => {
      const mockLeaderboard: LeaderboardResponse = {
        sports: [],
        athletes: [],
        countries: []
      };

      dataHolderService.leaderboardData.set(mockLeaderboard);

      const results = component['resultsForAthlete'](999);

      expect(results).toEqual([]);
    });

    it('should return sorted results with medals', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Swimming',
            sportRawName: 'swimming',
            scoreType: 'TIME',
            result: '47.50',
            rank: 1,
            medal: 'GOLD'
          },
          {
            sportId: 2,
            sportName: 'Running',
            sportRawName: 'running',
            scoreType: 'TIME',
            result: '10.00',
            rank: 2,
            medal: 'SILVER'
          }
        ]
      };

      const mockLeaderboard: LeaderboardResponse = {
        sports: [],
        athletes: [mockAthlete],
        countries: []
      };

      dataHolderService.leaderboardData.set(mockLeaderboard);

      const results = component['resultsForAthlete'](1);

      expect(results).toHaveLength(2);
      expect(results[0].medal).toBe('gold');
      expect(results[1].medal).toBe('silver');
    });

    it('should filter out results without medal', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Swimming',
            sportRawName: 'swimming',
            scoreType: 'TIME',
            result: '47.50',
            rank: 1,
            medal: 'GOLD'
          },
          {
            sportId: 2,
            sportName: 'Running',
            sportRawName: 'running',
            scoreType: 'TIME',
            result: '10.50',
            rank: 5,
            medal: null
          }
        ]
      };

      const mockLeaderboard: LeaderboardResponse = {
        sports: [],
        athletes: [mockAthlete],
        countries: []
      };

      dataHolderService.leaderboardData.set(mockLeaderboard);

      const results = component['resultsForAthlete'](1);

      expect(results).toHaveLength(1);
      expect(results[0].sport).toBe('Swimming');
    });

    it('should strip pts and wins from results', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Test',
            sportRawName: 'test',
            scoreType: 'PTS',
            result: '100 pts',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      const mockLeaderboard: LeaderboardResponse = {
        sports: [],
        athletes: [mockAthlete],
        countries: []
      };

      dataHolderService.leaderboardData.set(mockLeaderboard);

      const results = component['resultsForAthlete'](1);

      expect(results[0].result).toBe('100');
    });

    it('should handle null result using nullish coalescing', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Test',
            sportRawName: 'test',
            scoreType: 'TIME',
            result: null,
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      const mockLeaderboard: LeaderboardResponse = {
        sports: [],
        athletes: [mockAthlete],
        countries: []
      };

      dataHolderService.leaderboardData.set(mockLeaderboard);

      const results = component['resultsForAthlete'](1);

      expect(results[0].result).toBe('');
    });

    it('should handle null scoreType using nullish coalescing', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Test',
            sportRawName: 'test',
            scoreType: null,
            result: '100',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      const mockLeaderboard: LeaderboardResponse = {
        sports: [],
        athletes: [mockAthlete],
        countries: []
      };

      dataHolderService.leaderboardData.set(mockLeaderboard);

      const results = component['resultsForAthlete'](1);

      expect(results[0].scoreType).toBeNull();
    });

    it('should sort by sport name when medals are equal', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 2, silver: 0, bronze: 0, total: 2 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Swimming',
            sportRawName: 'swimming',
            scoreType: 'TIME',
            result: '47.50',
            rank: 1,
            medal: 'GOLD'
          },
          {
            sportId: 2,
            sportName: 'Athletics',
            sportRawName: 'athletics',
            scoreType: 'TIME',
            result: '10.00',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      const mockLeaderboard: LeaderboardResponse = {
        sports: [],
        athletes: [mockAthlete],
        countries: []
      };

      dataHolderService.leaderboardData.set(mockLeaderboard);

      const results = component['resultsForAthlete'](1);

      expect(results).toHaveLength(2);
      expect(results[0].sport).toBe('Athletics');
      expect(results[1].sport).toBe('Swimming');
    });
  });

  describe('toggleAthlete', () => {
    it('should not toggle when athlete has no results', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.leaderboardData.set({ sports: [], athletes: [mockAthlete], countries: [] });

      component['toggleAthlete'](mockAthlete);

      expect(component['expandedAthletes']().has(1)).toBe(false);
    });

    it('should add athlete to expanded set when not expanded', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Test',
            sportRawName: 'test',
            scoreType: 'TIME',
            result: '10.00',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      dataHolderService.leaderboardData.set({ sports: [], athletes: [mockAthlete], countries: [] });

      component['toggleAthlete'](mockAthlete);

      expect(component['expandedAthletes']().has(1)).toBe(true);
    });

    it('should remove athlete from expanded set when already expanded', () => {
      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: [
          {
            sportId: 1,
            sportName: 'Test',
            sportRawName: 'test',
            scoreType: 'TIME',
            result: '10.00',
            rank: 1,
            medal: 'GOLD'
          }
        ]
      };

      dataHolderService.leaderboardData.set({ sports: [], athletes: [mockAthlete], countries: [] });
      component['expandedAthletes'].set(new Set([1]));

      component['toggleAthlete'](mockAthlete);

      expect(component['expandedAthletes']().has(1)).toBe(false);
    });
  });

  describe('isAthleteExpanded', () => {
    it('should return true when athlete is in expanded set', () => {
      component['expandedAthletes'].set(new Set([1]));

      expect(component['isAthleteExpanded'](1)).toBe(true);
    });

    it('should return false when athlete is not in expanded set', () => {
      component['expandedAthletes'].set(new Set());

      expect(component['isAthleteExpanded'](1)).toBe(false);
    });
  });

  describe('splitNameAndCountry', () => {
    it('should split name correctly and find country', () => {
      const mockCountry: CountryStats = {
        countryId: 1,
        countryCode: 'US',
        countryName: 'USA',
        medals: { gold: 0, silver: 0, bronze: 0 }
      };

      dataHolderService.countriesData.set([mockCountry]);

      const result = component['splitNameAndCountry']({ name: 'John Doe', countryCode: '', countryName: 'USA', sport: '', sportRawName: '', scoreType: null, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.countryId).toBe(1);
    });

    it('should handle single name', () => {
      dataHolderService.countriesData.set([]);

      const result = component['splitNameAndCountry']({ name: 'John', countryCode: '', countryName: '', sport: '', sportRawName: '', scoreType: null, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('');
    });

    it('should use 0 for countryId when country not found', () => {
      dataHolderService.countriesData.set([]);

      const result = component['splitNameAndCountry']({ name: 'John Doe', countryCode: '', countryName: 'Nonexistent', sport: '', sportRawName: '', scoreType: null, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      expect(result.countryId).toBe(0);
    });

    it('should handle multiple spaces in name', () => {
      dataHolderService.countriesData.set([]);

      const result = component['splitNameAndCountry']({ name: 'John  Michael  Doe', countryCode: '', countryName: '', sport: '', sportRawName: '', scoreType: null, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Michael Doe');
    });

    it('should use empty string fallback when name is empty or whitespace', () => {
      dataHolderService.countriesData.set([]);

      const result = component['splitNameAndCountry']({ name: '   ', countryCode: '', countryName: '', sport: '', sportRawName: '', scoreType: null, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      expect(result.firstName).toBe('');
      expect(result.lastName).toBe('');
    });
  });
});
