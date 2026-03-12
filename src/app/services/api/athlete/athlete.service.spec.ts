import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AthleteService } from './athlete.service';
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { DataHolderService } from "../../data-holder/data-holder.service";
import { MiscService } from "../../misc/misc.service";
import { API_URL } from "../../../types/API";
import { AthletePayload, V2Athlete } from "../../../types/Athlete";
import { V2Sport } from "../../../types/Disciplines";

describe('AthleteService', () => {
  let service: AthleteService;
  let httpMock: HttpTestingController;
  let dataHolderService: DataHolderService;
  let miscService: MiscService;
  let translateService: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, TranslateModule.forRoot()] });
    service = TestBed.inject(AthleteService);
    httpMock = TestBed.inject(HttpTestingController);
    dataHolderService = TestBed.inject(DataHolderService);
    miscService = TestBed.inject(MiscService);
    translateService = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createAthlete', () => {
    it('should send POST request and return created athlete', fakeAsync(() => {
      const payload: AthletePayload = {
        firstName: 'John',
        lastName: 'Doe',
        countryId: 1
      };
      const mockResponse: V2Athlete = {
        id: 10,
        firstName: 'John',
        lastName: 'Doe',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      let result: V2Athlete | undefined;
      service.createAthlete(payload).subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/athletes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
    }));

    it('should handle error on create', fakeAsync(() => {
      const payload: AthletePayload = {
        firstName: 'Test',
        lastName: 'User',
        countryId: 999
      };

      let errorResponse: any;
      service.createAthlete(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/athletes`);
      req.flush('Invalid country ID', { status: 400, statusText: 'Bad Request' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(400);
    }));
  });

  describe('updateAthlete', () => {
    it('should send PUT request with id and return updated athlete', fakeAsync(() => {
      const athleteId = 5;
      const payload: AthletePayload = {
        firstName: 'Jane',
        lastName: 'Smith',
        countryId: 2
      };
      const mockResponse: V2Athlete = {
        id: athleteId,
        firstName: 'Jane',
        lastName: 'Smith',
        country: { id: 2, code: 'FR', name: 'France' },
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      let result: V2Athlete | undefined;
      service.updateAthlete(athleteId, payload).subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/athletes/${athleteId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
    }));

    it('should handle error on update', fakeAsync(() => {
      const athleteId = 999;
      const payload: AthletePayload = {
        firstName: 'Test',
        lastName: 'User',
        countryId: 1
      };

      let errorResponse: any;
      service.updateAthlete(athleteId, payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/athletes/${athleteId}`);
      req.flush('Athlete not found', { status: 404, statusText: 'Not Found' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(404);
    }));
  });

  describe('deleteAthlete', () => {
    it('should send DELETE request with id', fakeAsync(() => {
      const athleteId = 10;

      let completed = false;
      service.deleteAthlete(athleteId).subscribe(() => {
        completed = true;
      });

      const req = httpMock.expectOne(`${API_URL}/athletes/${athleteId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      tick();

      expect(completed).toBe(true);
    }));

    it('should handle error on delete', fakeAsync(() => {
      const athleteId = 50;

      let errorResponse: any;
      service.deleteAthlete(athleteId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/athletes/${athleteId}`);
      req.flush('Cannot delete athlete with results', { status: 400, statusText: 'Bad Request' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(400);
    }));
  });

  describe('patchAthleteAdd', () => {
    it('should add new athlete to all stores and normalize data', () => {
      const mockAthlete: V2Athlete = {
        id: 20,
        firstName: 'New',
        lastName: 'Athlete',
        country: { id: 1, code: 'US', name: 'United States', nameEn: 'United States', nameDe: 'Vereinigte Staaten', nameFr: 'États-Unis' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes).toHaveLength(1);
      expect(athletes[0].id).toBe(20);
      expect(athletes[0].country?.name).toBe('United States');

      const leaderboardData = dataHolderService.leaderboardData();
      expect(leaderboardData?.athletes).toHaveLength(1);
    });

    it('should handle athlete with null country', () => {
      const mockAthlete: V2Athlete = {
        id: 30,
        firstName: 'No',
        lastName: 'Country',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].country).toBeNull();
    });

    it('should handle athlete with undefined medals and results', () => {
      const mockAthlete = {
        id: 40,
        firstName: 'Test',
        lastName: 'Athlete',
        country: { id: 1, code: 'US', name: 'USA' },
        leaderboardRank: 1
      } as V2Athlete;

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].medals).toEqual({ gold: 0, silver: 0, bronze: 0, total: 0 });
      expect(athletes[0].results).toEqual([]);
    });

    it('should recalc country medals when athlete has medals', () => {
      const mockAthlete: V2Athlete = {
        id: 50,
        firstName: 'Medal',
        lastName: 'Winner',
        country: { id: 5, code: 'DE', name: 'Germany' },
        medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteAdd(mockAthlete);

      expect(recalcSpy).toHaveBeenCalledWith(5);
    });

    it('should not recalc country medals when athlete has no medals', () => {
      const mockAthlete: V2Athlete = {
        id: 60,
        firstName: 'No',
        lastName: 'Medals',
        country: { id: 3, code: 'FR', name: 'France' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteAdd(mockAthlete);

      expect(recalcSpy).not.toHaveBeenCalled();
    });

    it('should recalc with 0 when athlete has medals but null country', () => {
      const mockAthlete: V2Athlete = {
        id: 65,
        firstName: 'Medals',
        lastName: 'NoCountry',
        country: null,
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteAdd(mockAthlete);

      expect(recalcSpy).toHaveBeenCalledWith(0);
    });

    it('should handle null leaderboardData gracefully', () => {
      const mockAthlete: V2Athlete = {
        id: 70,
        firstName: 'Test',
        lastName: 'User',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set(null);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');

      expect(() => {
        service.patchAthleteAdd(mockAthlete);
      }).not.toThrow();

      expect(dataHolderService.leaderboardData()).toBeNull();
    });

    it('should resolve country name based on language (de)', () => {
      const mockAthlete: V2Athlete = {
        id: 80,
        firstName: 'German',
        lastName: 'Speaker',
        country: { id: 1, code: 'DE', name: 'Germany', nameEn: 'Germany', nameDe: 'Deutschland', nameFr: 'Allemagne' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].country?.name).toBe('Deutschland');
    });

    it('should resolve country name based on language (fr)', () => {
      const mockAthlete: V2Athlete = {
        id: 90,
        firstName: 'French',
        lastName: 'Speaker',
        country: { id: 1, code: 'FR', name: 'France', nameEn: 'France', nameDe: 'Frankreich', nameFr: 'France' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('fr');

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].country?.name).toBe('France');
    });

    it('should fallback to nameEn when language translation is missing', () => {
      const mockAthlete: V2Athlete = {
        id: 100,
        firstName: 'Test',
        lastName: 'Fallback',
        country: { id: 1, code: 'XX', name: 'Unknown', nameEn: 'English Name' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].country?.name).toBe('English Name');
    });

    it('should fallback to raw name when de language and no translations exist', () => {
      const mockAthlete: V2Athlete = {
        id: 105,
        firstName: 'Test',
        lastName: 'German',
        country: { id: 1, code: 'ZZ', name: 'Raw Country Name' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('de');

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].country?.name).toBe('Raw Country Name');
    });

    it('should fallback to nameEn when fr language and nameFr is missing', () => {
      const mockAthlete: V2Athlete = {
        id: 106,
        firstName: 'Test',
        lastName: 'French',
        country: { id: 1, code: 'AB', name: 'Raw Name', nameEn: 'English Translation' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('fr');

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].country?.name).toBe('English Translation');
    });

    it('should fallback to raw name when fr language and no translations exist', () => {
      const mockAthlete: V2Athlete = {
        id: 107,
        firstName: 'Test',
        lastName: 'FrenchRaw',
        country: { id: 1, code: 'CD', name: 'Only Raw Name' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('fr');

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].country?.name).toBe('Only Raw Name');
    });

    it('should fallback to raw name when no translations exist', () => {
      const mockAthlete: V2Athlete = {
        id: 110,
        firstName: 'Test',
        lastName: 'Raw',
        country: { id: 1, code: 'YY', name: 'Raw Name' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue(null as any);

      service.patchAthleteAdd(mockAthlete);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].country?.name).toBe('Raw Name');
    });
  });

  describe('patchAthleteUpdate', () => {
    it('should update athlete in all stores when id matches', () => {
      const existingAthlete: V2Athlete = {
        id: 1,
        firstName: 'Old',
        lastName: 'Name',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      const updatedAthlete: V2Athlete = {
        id: 1,
        firstName: 'New',
        lastName: 'Name',
        country: { id: 1, code: 'US', name: 'United States', nameEn: 'United States' },
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([existingAthlete]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [existingAthlete], countries: [] });
      dataHolderService.sports.set([]);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteUpdate(updatedAthlete, 1);

      const athletes = dataHolderService.athletes();
      expect(athletes[0].firstName).toBe('New');
      expect(athletes[0].lastName).toBe('Name');
    });

    it('should not update athlete when id does not match', () => {
      const athlete1: V2Athlete = {
        id: 1,
        firstName: 'Athlete',
        lastName: 'One',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      const athlete2: V2Athlete = {
        id: 2,
        firstName: 'Athlete',
        lastName: 'Two',
        country: { id: 2, code: 'FR', name: 'France' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 2,
        results: []
      };

      dataHolderService.athletes.set([athlete1, athlete2]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [athlete1, athlete2], countries: [] });
      dataHolderService.sports.set([]);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteUpdate(athlete2, 2);

      const athletes = dataHolderService.athletes();
      const unchangedAthlete = athletes.find(a => a.id === 1);
      expect(unchangedAthlete?.firstName).toBe('Athlete');
      expect(unchangedAthlete?.lastName).toBe('One');
    });

    it('should recalc medals for both countries when country changed', () => {
      const updatedAthlete: V2Athlete = {
        id: 1,
        firstName: 'Test',
        lastName: 'Athlete',
        country: { id: 2, code: 'FR', name: 'France' },
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      dataHolderService.sports.set([]);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteUpdate(updatedAthlete, 1);

      expect(recalcSpy).toHaveBeenCalledWith(1);
      expect(recalcSpy).toHaveBeenCalledWith(2);
      expect(recalcSpy).toHaveBeenCalledTimes(2);
    });

    it('should recalc medals only once when country did not change', () => {
      const updatedAthlete: V2Athlete = {
        id: 1,
        firstName: 'Test',
        lastName: 'Athlete',
        country: { id: 5, code: 'DE', name: 'Germany' },
        medals: { gold: 2, silver: 0, bronze: 0, total: 2 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      dataHolderService.sports.set([]);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteUpdate(updatedAthlete, 5);

      expect(recalcSpy).toHaveBeenCalledWith(5);
      expect(recalcSpy).toHaveBeenCalledTimes(1);
    });

    it('should update participants in sports', () => {
      const updatedAthlete: V2Athlete = {
        id: 10,
        firstName: 'Updated',
        lastName: 'Athlete',
        country: { id: 3, code: 'IT', name: 'Italy' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      const mockSport: V2Sport = {
        id: 1,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: [
          {
            athleteId: 10,
            firstName: 'Old',
            lastName: 'Name',
            countryId: 1,
            countryCode: 'US',
            countryName: 'USA',
            medal: 'GOLD',
            result: '50.00',
            rank: null,
            resultId: 100
          }
        ]
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      dataHolderService.sports.set([mockSport]);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteUpdate(updatedAthlete, 1);

      const sports = dataHolderService.sports();
      const participant = sports[0].participants[0];
      expect(participant.firstName).toBe('Updated');
      expect(participant.lastName).toBe('Athlete');
      expect(participant.countryId).toBe(3);
      expect(participant.countryCode).toBe('IT');
      expect(participant.countryName).toBe('Italy');
    });

    it('should not update participant when athleteId does not match', () => {
      const updatedAthlete: V2Athlete = {
        id: 20,
        firstName: 'Updated',
        lastName: 'Athlete',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      const mockSport: V2Sport = {
        id: 1,
        rawName: 'running',
        name: 'Running',
        scoreType: 'TIME',
        participants: [
          {
            athleteId: 10,
            firstName: 'Other',
            lastName: 'Athlete',
            countryId: 2,
            countryCode: 'FR',
            countryName: 'France',
            medal: 'SILVER',
            result: '60.00',
            rank: null,
            resultId: 200
          }
        ]
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      dataHolderService.sports.set([mockSport]);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteUpdate(updatedAthlete, 1);

      const sports = dataHolderService.sports();
      const participant = sports[0].participants[0];
      expect(participant.firstName).toBe('Other');
      expect(participant.lastName).toBe('Athlete');
    });

    it('should handle null leaderboardData gracefully', () => {
      const updatedAthlete: V2Athlete = {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set(null);
      dataHolderService.sports.set([]);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchAthleteUpdate(updatedAthlete, 1);
      }).not.toThrow();

      expect(dataHolderService.leaderboardData()).toBeNull();
    });

    it('should use nullish coalescing for country properties in participants', () => {
      const updatedAthlete: V2Athlete = {
        id: 10,
        firstName: 'Test',
        lastName: 'Athlete',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test-sport',
        name: 'Test Sport',
        scoreType: 'PTS',
        participants: [
          {
            athleteId: 10,
            firstName: 'Old',
            lastName: 'Name',
            countryId: 5,
            countryCode: 'XX',
            countryName: 'Original',
            medal: 'GOLD',
            result: '100',
            rank: null,
            resultId: 100
          }
        ]
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      dataHolderService.sports.set([mockSport]);
      jest.spyOn(translateService, 'getCurrentLang').mockReturnValue('en');
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteUpdate(updatedAthlete, 1);

      const sports = dataHolderService.sports();
      const participant = sports[0].participants[0];
      expect(participant.countryId).toBe(5);
      expect(participant.countryCode).toBe('XX');
      expect(participant.countryName).toBe('Original');
    });
  });

  describe('patchAthleteDelete', () => {
    it('should remove athlete from all stores', () => {
      const athlete1: V2Athlete = {
        id: 1,
        firstName: 'Keep',
        lastName: 'Me',
        country: { id: 1, code: 'US', name: 'USA' },
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      const athlete2: V2Athlete = {
        id: 2,
        firstName: 'Delete',
        lastName: 'Me',
        country: { id: 2, code: 'FR', name: 'France' },
        medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
        leaderboardRank: 2,
        results: []
      };

      dataHolderService.athletes.set([athlete1, athlete2]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [athlete1, athlete2], countries: [] });
      dataHolderService.sports.set([]);
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteDelete(2, 2);

      const athletes = dataHolderService.athletes();
      expect(athletes).toHaveLength(1);
      expect(athletes[0].id).toBe(1);

      const leaderboardData = dataHolderService.leaderboardData();
      expect(leaderboardData?.athletes).toHaveLength(1);
    });

    it('should remove participants from sports', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'athletics',
        name: 'Athletics',
        scoreType: 'TIME',
        participants: [
          {
            athleteId: 5,
            firstName: 'Keep',
            lastName: 'Participant',
            countryId: 1,
            countryCode: 'US',
            countryName: 'USA',
            medal: 'GOLD',
            result: '10.00',
            rank: null,
            resultId: 100
          },
          {
            athleteId: 10,
            firstName: 'Remove',
            lastName: 'Participant',
            countryId: 2,
            countryCode: 'FR',
            countryName: 'France',
            medal: 'SILVER',
            result: '10.50',
            rank: null,
            resultId: 101
          }
        ]
      };

      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      dataHolderService.sports.set([mockSport]);
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteDelete(10, 2);

      const sports = dataHolderService.sports();
      expect(sports[0].participants).toHaveLength(1);
      expect(sports[0].participants[0].athleteId).toBe(5);
    });

    it('should call recalcCountryMedals after deletion', () => {
      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set({ sports: [], athletes: [], countries: [] });
      dataHolderService.sports.set([]);
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchAthleteDelete(10, 5);

      expect(recalcSpy).toHaveBeenCalledWith(5);
    });

    it('should handle null leaderboardData gracefully', () => {
      dataHolderService.athletes.set([]);
      dataHolderService.leaderboardData.set(null);
      dataHolderService.sports.set([]);
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchAthleteDelete(1, 1);
      }).not.toThrow();

      expect(dataHolderService.leaderboardData()).toBeNull();
    });
  });
});


