import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ActivatedRoute } from "@angular/router";
import { PLATFORM_ID } from "@angular/core";
import { ApiService } from "../../services/api/api.service";
import { AlertService } from "../../services/api/alert/alert.service";
import { defer, Subject } from "rxjs";
import { LeaderboardResponse } from "../../types/API";
import { V2Country } from "../../types/Country";
import { V2Sport } from "../../types/Disciplines";
import { HttpErrorResponse } from "@angular/common/http";

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let apiService: ApiService;
  let alertService: AlertService;
  let translateService: TranslateService;

  const mockLeaderboardResponse: LeaderboardResponse = {
    countries: [],
    sports: [],
    athletes: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [{ provide: ActivatedRoute, useValue: {} }]
    })
      .compileComponents();
  });

  describe('constructor - browser platform', () => {
    it('should set skipEntryAnimation to false when document is not complete and load data', fakeAsync(() => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading'
      });

      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(false);

      tick();
    }));

    it('should set skipEntryAnimation to true when document is complete', fakeAsync(() => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });

      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(true);

      tick();
    }));

    it('should subscribe to language changes and reload data', fakeAsync(() => {
      const langChangeSubject = new Subject<any>();

      apiService = TestBed.inject(ApiService);
      translateService = TestBed.inject(TranslateService);

      const getLeaderboardSpy = jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));
      Object.defineProperty(translateService, 'onLangChange', {
        value: langChangeSubject.asObservable()
      });

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      tick();

      expect(getLeaderboardSpy).toHaveBeenCalledTimes(1);

      langChangeSubject.next({ lang: 'de' });

      tick();

      expect(getLeaderboardSpy).toHaveBeenCalledTimes(2);
    }));
  });

  describe('constructor - server platform', () => {
    it('should not check document.readyState on server platform', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HomeComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [
          { provide: ActivatedRoute, useValue: {} },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      }).compileComponents();

      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from translateSub and dataSub when they exist', fakeAsync(() => {
      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      tick();

      const translateUnsubSpy = jest.spyOn(component['translateSub']!, 'unsubscribe');
      const dataUnsubSpy = jest.spyOn(component['dataSub']!, 'unsubscribe');

      component.ngOnDestroy();

      expect(translateUnsubSpy).toHaveBeenCalled();
      expect(dataUnsubSpy).toHaveBeenCalled();
    }));

    it('should not throw error when translateSub is undefined', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HomeComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [
          { provide: ActivatedRoute, useValue: {} },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      }).compileComponents();

      apiService = TestBed.inject(ApiService);
      translateService = TestBed.inject(TranslateService);

      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      const langChangeSubject = new Subject<any>();
      Object.defineProperty(translateService, 'onLangChange', {
        value: langChangeSubject.asObservable()
      });

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      (component as any).translateSub = undefined;

      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });

    it('should not throw error when dataSub is undefined', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HomeComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [
          { provide: ActivatedRoute, useValue: {} },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      }).compileComponents();

      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      (component as any).dataSub = undefined;

      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('topCountries computed signal', () => {
    beforeEach(fakeAsync(() => {
      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      tick();
    }));

    it('should call buildOverallTop10 when filterSport is "all"', () => {
      const buildOverallSpy = jest.spyOn(component as any, 'buildOverallTop10');

      component['filterSport'].set('all');
      component['topCountries']();

      expect(buildOverallSpy).toHaveBeenCalled();
    });

    it('should call buildTop10ForSport when filterSport is specific sport', () => {
      const buildSportSpy = jest.spyOn(component as any, 'buildTop10ForSport');

      component['filterSport'].set('swimming-100m');
      component['topCountries']();

      expect(buildSportSpy).toHaveBeenCalledWith('swimming-100m');
    });
  });

  describe('buildOverallTop10', () => {
    beforeEach(fakeAsync(() => {
      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      tick();
    }));

    it('should return top 10 countries sorted by leaderboardRank', () => {
      const mockCountries: V2Country[] = [
        { id: 1, code: 'US', name: 'USA', medals: { gold: 10, silver: 8, bronze: 6, total: 24 }, leaderboardRank: 1, athletes: [] },
        { id: 2, code: 'CN', name: 'China', medals: { gold: 9, silver: 7, bronze: 5, total: 21 }, leaderboardRank: 2, athletes: [] },
        { id: 3, code: 'GB', name: 'Great Britain', medals: { gold: 8, silver: 6, bronze: 4, total: 18 }, leaderboardRank: 3, athletes: [] }
      ];

      component['allCountries'].set(mockCountries);
      component['filterSport'].set('all');

      const result = component['topCountries']();

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      expect(result[0].countryName).toBe('USA');
      expect(result[0].gold).toBe(10);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it('should limit results to 10 countries', () => {
      const mockCountries: V2Country[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        code: `C${i}`,
        name: `Country ${i}`,
        medals: { gold: 10 - i, silver: 5, bronze: 3, total: 18 - i },
        leaderboardRank: i + 1,
        athletes: []
      }));

      component['allCountries'].set(mockCountries);
      component['filterSport'].set('all');

      const result = component['topCountries']();

      expect(result).toHaveLength(10);
    });

    it('should use index+1 as rank when leaderboardRank is null', () => {
      const mockCountries: V2Country[] = [
        { id: 1, code: 'US', name: 'USA', medals: { gold: 5, silver: 3, bronze: 2, total: 10 }, leaderboardRank: null as any, athletes: [] }
      ];

      component['allCountries'].set(mockCountries);
      component['filterSport'].set('all');

      const result = component['topCountries']();

      expect(result[0].rank).toBe(1);
    });

    it('should convert country code to lowercase', () => {
      const mockCountries: V2Country[] = [
        { id: 1, code: 'US', name: 'USA', medals: { gold: 5, silver: 3, bronze: 2, total: 10 }, leaderboardRank: 1, athletes: [] }
      ];

      component['allCountries'].set(mockCountries);
      component['filterSport'].set('all');

      const result = component['topCountries']();

      expect(result[0].countryCode).toBe('us');
    });
  });

  describe('buildTop10ForSport', () => {
    beforeEach(fakeAsync(() => {
      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      tick();
    }));

    it('should return empty array when sport is not found', () => {
      component['allSports'].set([]);
      component['filterSport'].set('non-existent-sport');

      const result = component['topCountries']();

      expect(result).toEqual([]);
    });

    it('should aggregate medals by country and sort correctly', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'swimming-100m',
        name: 'Swimming 100m',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'John', lastName: 'Doe', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 },
          { athleteId: 2, firstName: 'Jane', lastName: 'Smith', countryId: 2, countryCode: 'CN', countryName: 'China', medal: 'SILVER', result: '47.50', rank: 2, resultId: 2 },
          { athleteId: 3, firstName: 'Bob', lastName: 'Johnson', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'BRONZE', result: '47.80', rank: 3, resultId: 3 }
        ]
      };

      component['allSports'].set([mockSport]);
      component['filterSport'].set('swimming-100m');

      const result = component['topCountries']();

      expect(result).toHaveLength(2);
      expect(result[0].countryCode).toBe('us');
      expect(result[0].gold).toBe(1);
      expect(result[0].bronze).toBe(1);
      expect(result[0].rank).toBe(1);
      expect(result[1].countryCode).toBe('cn');
      expect(result[1].silver).toBe(1);
      expect(result[1].rank).toBe(2);
    });

    it('should filter out countries with zero medals', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'athletics',
        name: 'Athletics',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Runner', lastName: 'One', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '9.80', rank: 1, resultId: 1 }
        ]
      };

      component['allSports'].set([mockSport]);
      component['filterSport'].set('athletics');

      const result = component['topCountries']();

      expect(result).toHaveLength(1);
      expect(result[0].countryCode).toBe('us');
    });

    it('should limit results to top 10 countries', () => {
      const participants = Array.from({ length: 15 }, (_, i) => ({
        athleteId: i + 1,
        firstName: 'Athlete',
        lastName: `${i}`,
        countryId: i + 1,
        countryCode: `C${i}`,
        countryName: `Country ${i}`,
        medal: 'GOLD' as const,
        result: '100',
        rank: i + 1,
        resultId: i + 1
      }));

      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test-sport',
        name: 'Test Sport',
        scoreType: 'PTS',
        participants
      };

      component['allSports'].set([mockSport]);
      component['filterSport'].set('test-sport');

      const result = component['topCountries']();

      expect(result).toHaveLength(10);
    });

    it('should sort by gold, then silver, then bronze', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'multi-sport',
        name: 'Multi Sport',
        scoreType: 'PTS',
        participants: [
          { athleteId: 1, firstName: 'A', lastName: 'A', countryId: 1, countryCode: 'A', countryName: 'Country A', medal: 'SILVER', result: '1', rank: 1, resultId: 1 },
          { athleteId: 2, firstName: 'A', lastName: 'A', countryId: 1, countryCode: 'A', countryName: 'Country A', medal: 'SILVER', result: '1', rank: 1, resultId: 2 },
          { athleteId: 3, firstName: 'B', lastName: 'B', countryId: 2, countryCode: 'B', countryName: 'Country B', medal: 'GOLD', result: '1', rank: 1, resultId: 3 },
          { athleteId: 4, firstName: 'C', lastName: 'C', countryId: 3, countryCode: 'C', countryName: 'Country C', medal: 'BRONZE', result: '1', rank: 1, resultId: 4 },
          { athleteId: 5, firstName: 'C', lastName: 'C', countryId: 3, countryCode: 'C', countryName: 'Country C', medal: 'BRONZE', result: '1', rank: 1, resultId: 5 },
          { athleteId: 6, firstName: 'C', lastName: 'C', countryId: 3, countryCode: 'C', countryName: 'Country C', medal: 'BRONZE', result: '1', rank: 1, resultId: 6 }
        ]
      };

      component['allSports'].set([mockSport]);
      component['filterSport'].set('multi-sport');

      const result = component['topCountries']();

      expect(result[0].countryCode).toBe('b');
      expect(result[1].countryCode).toBe('a');
      expect(result[2].countryCode).toBe('c');
    });
  });

  describe('aggregateMedalsByCountry', () => {
    beforeEach(fakeAsync(() => {
      apiService = TestBed.inject(ApiService);
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;
      tick();
    }));

    it('should skip participants without medal', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'PTS',
        participants: [
          { athleteId: 1, firstName: 'No', lastName: 'Medal', countryId: 1, countryCode: 'US', countryName: 'USA', medal: null, result: '100', rank: 1, resultId: 1 }
        ]
      };

      component['allSports'].set([mockSport]);
      component['filterSport'].set('test');

      const result = component['topCountries']();

      expect(result).toEqual([]);
    });

    it('should skip participants without countryCode', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'PTS',
        participants: [
          { athleteId: 1, firstName: 'No', lastName: 'Country', countryId: null, countryCode: null, countryName: null, medal: 'GOLD', result: '100', rank: 1, resultId: 1 }
        ]
      };

      component['allSports'].set([mockSport]);
      component['filterSport'].set('test');

      const result = component['topCountries']();

      expect(result).toEqual([]);
    });

    it('should use countryCode as fallback when countryName is null', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'PTS',
        participants: [
          { athleteId: 1, firstName: 'Test', lastName: 'Athlete', countryId: 1, countryCode: 'XX', countryName: null, medal: 'GOLD', result: '100', rank: 1, resultId: 1 }
        ]
      };

      component['allSports'].set([mockSport]);
      component['filterSport'].set('test');

      const result = component['topCountries']();

      expect(result[0].countryName).toBe('XX');
    });

    it('should correctly count GOLD, SILVER, and BRONZE medals', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'PTS',
        participants: [
          { athleteId: 1, firstName: 'A', lastName: 'A', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '1', rank: 1, resultId: 1 },
          { athleteId: 2, firstName: 'B', lastName: 'B', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '1', rank: 1, resultId: 2 },
          { athleteId: 3, firstName: 'C', lastName: 'C', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'SILVER', result: '1', rank: 1, resultId: 3 },
          { athleteId: 4, firstName: 'D', lastName: 'D', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'BRONZE', result: '1', rank: 1, resultId: 4 },
          { athleteId: 5, firstName: 'E', lastName: 'E', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'BRONZE', result: '1', rank: 1, resultId: 5 },
          { athleteId: 6, firstName: 'F', lastName: 'F', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'BRONZE', result: '1', rank: 1, resultId: 6 }
        ]
      };

      component['allSports'].set([mockSport]);
      component['filterSport'].set('test');

      const result = component['topCountries']();

      expect(result[0].gold).toBe(2);
      expect(result[0].silver).toBe(1);
      expect(result[0].bronze).toBe(3);
    });
  });

  describe('loadData', () => {
    beforeEach(() => {
      apiService = TestBed.inject(ApiService);
      alertService = TestBed.inject(AlertService);
      translateService = TestBed.inject(TranslateService);
    });

    it('should not load when already loading', fakeAsync(() => {
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      tick();

      component['isLoading'].set(true);
      const getLeaderboardSpy = jest.spyOn(apiService, 'getLeaderboard');

      component['loadData']();

      expect(getLeaderboardSpy).not.toHaveBeenCalledTimes(2);
    }));

    it('should set loading state and fetch data successfully', fakeAsync(() => {
      const mockCountries: V2Country[] = [
        { id: 1, code: 'US', name: 'USA', medals: { gold: 5, silver: 3, bronze: 2, total: 10 }, leaderboardRank: 1, athletes: [] }
      ];
      const mockSports: V2Sport[] = [
        { id: 1, rawName: 'swimming', name: 'Swimming', scoreType: 'TIME', participants: [] }
      ];
      const mockResponse: LeaderboardResponse = {
        countries: mockCountries,
        sports: mockSports,
        athletes: []
      };

      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      expect(component['isLoading']()).toBe(true);

      tick();

      expect(component['isLoading']()).toBe(false);
      expect(component['allCountries']()).toEqual(mockCountries);
      expect(component['allSports']()).toEqual(mockSports);
    }));

    it('should use default language "en" when getCurrentLang returns null', fakeAsync(() => {
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue(null as any);
      const getLeaderboardSpy = jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockLeaderboardResponse)));

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      tick();

      expect(getLeaderboardSpy).toHaveBeenCalledWith('en');
    }));

    it('should handle error and show alert', fakeAsync(() => {
      const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValue('Error message');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      fixture = TestBed.createComponent(HomeComponent);
      component = fixture.componentInstance;

      expect(component['isLoading']()).toBe(true);

      tick();

      expect(component['isLoading']()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading home data:', mockError);
      expect(alertSpy).toHaveBeenCalledWith('Error message');
      expect(translateService.instant).toHaveBeenCalledWith('ALERT.ERROR');

      consoleSpy.mockRestore();
    }));
  });
});
