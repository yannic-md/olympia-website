import { DataHolderService } from "./data-holder.service";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ApiService } from "../api/api.service";
import { AlertService } from "../api/alert/alert.service";
import { defer } from "rxjs";
import { LeaderboardResponse } from "../../types/API";
import { V2Country } from "../../types/Country";
import { V2Athlete } from "../../types/Athlete";
import { V2Sport } from "../../types/Disciplines";
import { HttpErrorResponse } from "@angular/common/http";

describe('DataHolderService', () => {
  let service: DataHolderService;
  let apiService: ApiService;
  let alertService: AlertService;
  let translateService: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()]
    });
    service = TestBed.inject(DataHolderService);
    apiService = TestBed.inject(ApiService);
    alertService = TestBed.inject(AlertService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize leaderboardData signal with null', () => {
    expect(service.leaderboardData()).toBeNull();
  });

  it('should initialize countriesData signal with empty array', () => {
    expect(service.countriesData()).toEqual([]);
  });

  it('should initialize sports signal with empty array', () => {
    expect(service.sports()).toEqual([]);
  });

  it('should initialize athletes signal with empty array', () => {
    expect(service.athletes()).toEqual([]);
  });

  it('should initialize isLoading signal with false', () => {
    expect(service.isLoading()).toBe(false);
  });

  it('should compute countries from countriesData sorted alphabetically', () => {
    service.countriesData.set([
      { countryId: 1, countryCode: 'US', countryName: 'USA', medals: { gold: 0, silver: 0, bronze: 0 }, nameEn: 'USA', nameDe: 'USA', nameFr: 'USA' },
      { countryId: 2, countryCode: 'FR', countryName: 'France', medals: { gold: 0, silver: 0, bronze: 0 }, nameEn: 'France', nameDe: 'Frankreich', nameFr: 'France' },
      { countryId: 3, countryCode: 'DE', countryName: 'Germany', medals: { gold: 0, silver: 0, bronze: 0 }, nameEn: 'Germany', nameDe: 'Deutschland', nameFr: 'Allemagne' }
    ]);

    const countries = service.countries();

    expect(countries).toEqual(['France', 'Germany', 'USA']);
  });

  it('should compute empty array when countriesData is empty', () => {
    service.countriesData.set([]);

    const countries = service.countries();

    expect(countries).toEqual([]);
  });

  describe('load', () => {
    it('should load leaderboard data successfully', fakeAsync(() => {
      const mockCountries: V2Country[] = [
        {
          id: 1,
          code: 'US',
          name: 'USA',
          nameEn: 'USA',
          nameDe: 'USA',
          nameFr: 'USA',
          medals: {gold: 5, silver: 3, bronze: 2, total: 10},
          leaderboardRank: 0,
          athletes: []
        }
      ];
      const mockSports: V2Sport[] = [
        {
          id: 1, name: 'Swimming', rawName: 'Swimming',
          scoreType: "TIME",
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: mockCountries[0],
          sports: [],
          medals: {gold: 1, silver: 0, bronze: 0}
        } as unknown as V2Athlete
      ];
      const mockResponse: LeaderboardResponse = {
        countries: mockCountries,
        sports: mockSports,
        athletes: mockAthletes
      };

      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockResponse)));

      service.load();

      expect(service.isLoading()).toBe(true);

      tick();

      expect(service.isLoading()).toBe(false);
      expect(service.leaderboardData()).toEqual(mockResponse);
      expect(service.sports()).toEqual(mockSports);
      expect(service.athletes()).toEqual(mockAthletes);
      expect(service.countriesData()).toHaveLength(1);
      expect(service.countriesData()[0].countryId).toBe(1);
      expect(service.countriesData()[0].countryName).toBe('USA');
    }));

    it('should use default language "en" when getCurrentLang returns null', fakeAsync(() => {
      const mockResponse: LeaderboardResponse = {
        countries: [],
        sports: [],
        athletes: []
      };

      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue(null as any);
      const getLeaderboardSpy = jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockResponse)));

      service.load();
      tick();

      expect(getLeaderboardSpy).toHaveBeenCalledWith('en');
    }));

    it('should use current language from TranslateService', fakeAsync(() => {
      const mockResponse: LeaderboardResponse = {
        countries: [],
        sports: [],
        athletes: []
      };

      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');
      const getLeaderboardSpy = jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockResponse)));

      service.load();
      tick();

      expect(getLeaderboardSpy).toHaveBeenCalledWith('de');
    }));

    it('should not load if already loading', fakeAsync(() => {
      const mockResponse: LeaderboardResponse = {
        countries: [],
        sports: [],
        athletes: []
      };

      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      const getLeaderboardSpy = jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockResponse)));

      service.isLoading.set(true);
      service.load();

      expect(getLeaderboardSpy).not.toHaveBeenCalled();
    }));

    it('should handle error and set isLoading to false', fakeAsync(() => {
      const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(translateService, 'instant').mockReturnValue('Error occurred');
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.reject(mockError)));
      const alertErrorSpy = jest.spyOn(alertService, 'error').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.load();

      expect(service.isLoading()).toBe(true);

      tick();

      expect(service.isLoading()).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading V2 leaderboard data:', mockError);
      expect(alertErrorSpy).toHaveBeenCalledWith('Error occurred');
      expect(translateService.instant).toHaveBeenCalledWith('ALERT.ERROR');

      consoleErrorSpy.mockRestore();
    }));

    it('should map countries correctly with all properties', fakeAsync(() => {
      const mockCountries: V2Country[] = [
        {
          id: 100,
          code: 'DE',
          name: 'Germany',
          nameEn: 'Germany',
          nameDe: 'Deutschland',
          nameFr: 'Allemagne',
          medals: {gold: 10, silver: 8, bronze: 6, total: 24},
          leaderboardRank: 0,
          athletes: []
        },
        {
          id: 200,
          code: 'FR',
          name: 'France',
          nameEn: 'France',
          nameDe: 'Frankreich',
          nameFr: 'France',
          medals: {gold: 7, silver: 9, bronze: 5, total: 21},
          leaderboardRank: 0,
          athletes: []
        }
      ];
      const mockResponse: LeaderboardResponse = {
        countries: mockCountries,
        sports: [],
        athletes: []
      };

      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockResponse)));

      service.load();
      tick();

      const mappedCountries = service.countriesData();

      expect(mappedCountries).toHaveLength(2);
      expect(mappedCountries[0]).toEqual({
        countryId: 100,
        countryCode: 'DE',
        countryName: 'Germany',
        medals: { gold: 10, silver: 8, bronze: 6 },
        nameEn: 'Germany',
        nameDe: 'Deutschland',
        nameFr: 'Allemagne'
      });
      expect(mappedCountries[1]).toEqual({
        countryId: 200,
        countryCode: 'FR',
        countryName: 'France',
        medals: { gold: 7, silver: 9, bronze: 5 },
        nameEn: 'France',
        nameDe: 'Frankreich',
        nameFr: 'France'
      });
    }));

    it('should handle empty response data', fakeAsync(() => {
      const mockResponse: LeaderboardResponse = {
        countries: [],
        sports: [],
        athletes: []
      };

      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockResponse)));

      service.load();
      tick();

      expect(service.leaderboardData()).toEqual(mockResponse);
      expect(service.countriesData()).toEqual([]);
      expect(service.sports()).toEqual([]);
      expect(service.athletes()).toEqual([]);
      expect(service.isLoading()).toBe(false);
    }));

    it('should set all signals correctly in success response', fakeAsync(() => {
      const mockCountries: V2Country[] = [
        {
          id: 1,
          code: 'US',
          name: 'USA',
          nameEn: 'USA',
          nameDe: 'USA',
          nameFr: 'USA',
          medals: {gold: 1, silver: 2, bronze: 3, total: 6},
          leaderboardRank: 0,
          athletes: []
        }
      ];
      const mockSports: V2Sport[] = [
        {
          id: 1, name: 'Athletics', rawName: 'Athletics',
          scoreType: "TIME",
          participants: []
        },
        {
          id: 2, name: 'Swimming', rawName: 'Swimming',
          scoreType: "TIME",
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'Jane',
          lastName: 'Doe',
          country: mockCountries[0],
          sports: [],
          medals: {gold: 1, silver: 0, bronze: 0}
        } as unknown as V2Athlete,
        {
          id: 2,
          firstName: 'John',
          lastName: 'Smith',
          country: mockCountries[0],
          sports: [],
          medals: {gold: 0, silver: 1, bronze: 0}
        } as unknown as V2Athlete
      ];
      const mockResponse: LeaderboardResponse = {
        countries: mockCountries,
        sports: mockSports,
        athletes: mockAthletes
      };

      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('fr');
      jest.spyOn(apiService, 'getLeaderboard').mockReturnValue(defer(() => Promise.resolve(mockResponse)));

      service.load();
      tick();

      expect(service.leaderboardData()).toBe(mockResponse);
      expect(service.sports()).toEqual(mockSports);
      expect(service.athletes()).toEqual(mockAthletes);
      expect(service.countriesData()).toHaveLength(1);
      expect(service.isLoading()).toBe(false);
    }));
  });
});
