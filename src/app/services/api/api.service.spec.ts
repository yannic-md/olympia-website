import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { ApiService } from "./api.service";
import { API_URL, LeaderboardResponse } from "../../types/API";
import { V2Sport } from "../../types/Disciplines";
import { V2Athlete } from "../../types/Athlete";
import { V2Country } from "../../types/Country";

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLeaderboard', () => {
    it('should fetch leaderboard data with English language', fakeAsync(() => {
      const mockResponse: LeaderboardResponse = {
        sports: [],
        athletes: [],
        countries: []
      };

      let result: LeaderboardResponse | undefined;
      service.getLeaderboard('en').subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=en`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
    }));

    it('should fetch leaderboard data with German language', fakeAsync(() => {
      const mockResponse: LeaderboardResponse = {
        sports: [],
        athletes: [],
        countries: []
      };

      let result: LeaderboardResponse | undefined;
      service.getLeaderboard('de').subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=de`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
    }));

    it('should fetch leaderboard data with French language', fakeAsync(() => {
      const mockResponse: LeaderboardResponse = {
        sports: [],
        athletes: [],
        countries: []
      };

      let result: LeaderboardResponse | undefined;
      service.getLeaderboard('fr').subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=fr`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
    }));

    it('should return complete leaderboard response with sports, athletes and countries', fakeAsync(() => {
      const mockSports: V2Sport[] = [
        { id: 1, rawName: 'swimming', name: 'Swimming', scoreType: 'TIME', participants: [] }
      ];
      const mockCountries: V2Country[] = [
        {
          id: 1,
          code: 'US',
          name: 'USA',
          nameEn: 'USA',
          nameDe: 'USA',
          nameFr: 'USA',
          medals: { gold: 5, silver: 3, bronze: 2, total: 10 },
          leaderboardRank: 1,
          athletes: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: { id: 1, code: 'US', name: 'USA', nameEn: 'USA', nameDe: 'USA', nameFr: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];
      const mockResponse: LeaderboardResponse = {
        sports: mockSports,
        athletes: mockAthletes,
        countries: mockCountries
      };

      let result: LeaderboardResponse | undefined;
      service.getLeaderboard('en').subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=en`);
      req.flush(mockResponse);

      tick();

      expect(result).toBeDefined();
      expect(result?.sports).toEqual(mockSports);
      expect(result?.athletes).toEqual(mockAthletes);
      expect(result?.countries).toEqual(mockCountries);
    }));

    it('should handle HTTP error response', fakeAsync(() => {
      const errorMessage = 'Server error';
      let errorResponse: any;

      service.getLeaderboard('en').subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=en`);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(500);
      expect(errorResponse.statusText).toBe('Internal Server Error');
    }));

    it('should handle 404 not found error', fakeAsync(() => {
      let errorResponse: any;

      service.getLeaderboard('en').subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=en`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(404);
    }));

    it('should handle network error', fakeAsync(() => {
      let errorResponse: any;

      service.getLeaderboard('en').subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=en`);
      req.error(new ProgressEvent('Network error'));

      tick();

      expect(errorResponse).toBeDefined();
    }));

    it('should handle empty response data', fakeAsync(() => {
      const mockResponse: LeaderboardResponse = {
        sports: [],
        athletes: [],
        countries: []
      };

      let result: LeaderboardResponse | undefined;
      service.getLeaderboard('en').subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=en`);
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
      expect(result?.sports).toEqual([]);
      expect(result?.athletes).toEqual([]);
      expect(result?.countries).toEqual([]);
    }));

    it('should construct correct URL with language parameter', fakeAsync(() => {
      const lang = 'custom';

      service.getLeaderboard(lang).subscribe();

      const req = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=${lang}`);
      expect(req.request.url).toBe(`${API_URL}/v2/public/leaderboard?lang=custom`);
      req.flush({ sports: [], athletes: [], countries: [] });

      tick();
    }));

    it('should make only one HTTP request per call', fakeAsync(() => {
      service.getLeaderboard('en').subscribe();

      const requests = httpMock.match(`${API_URL}/v2/public/leaderboard?lang=en`);
      expect(requests.length).toBe(1);

      requests[0].flush({ sports: [], athletes: [], countries: [] });

      tick();
    }));

    it('should handle multiple concurrent requests', fakeAsync(() => {
      let result1: LeaderboardResponse | undefined;
      let result2: LeaderboardResponse | undefined;

      const mockResponse1: LeaderboardResponse = {
        sports: [],
        athletes: [],
        countries: []
      };
      const mockResponse2: LeaderboardResponse = {
        sports: [],
        athletes: [],
        countries: []
      };

      service.getLeaderboard('en').subscribe(data => result1 = data);
      service.getLeaderboard('de').subscribe(data => result2 = data);

      const req1 = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=en`);
      const req2 = httpMock.expectOne(`${API_URL}/v2/public/leaderboard?lang=de`);

      req1.flush(mockResponse1);
      req2.flush(mockResponse2);

      tick();

      expect(result1).toEqual(mockResponse1);
      expect(result2).toEqual(mockResponse2);
    }));
  });
});
