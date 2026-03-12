import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CountryService } from './country.service';
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { API_URL } from "../../../types/API";
import { FormCountryPayload, V2Country } from "../../../types/Country";

describe('CountryService', () => {
  let service: CountryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CountryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCountry', () => {
    it('should send POST request and return created country', fakeAsync(() => {
      const payload: FormCountryPayload = {
        code: 'DE',
        name: 'Germany',
        nameEn: 'Germany',
        nameDe: 'Deutschland',
        nameFr: 'Allemagne'
      };
      const mockResponse: V2Country = {
        id: 1,
        code: 'DE',
        name: 'Germany',
        nameEn: 'Germany',
        nameDe: 'Deutschland',
        nameFr: 'Allemagne',
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        athletes: []
      };

      let result: V2Country | undefined;
      service.createCountry(payload).subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/countries`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
    }));

    it('should handle error on create', fakeAsync(() => {
      const payload: FormCountryPayload = {
        code: 'FR',
        name: 'France'
      };

      let errorResponse: any;
      service.createCountry(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/countries`);
      req.flush('Duplicate country code', { status: 409, statusText: 'Conflict' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(409);
    }));
  });

  describe('updateCountry', () => {
    it('should send PUT request with id and return updated country', fakeAsync(() => {
      const countryId = 5;
      const payload: FormCountryPayload = {
        code: 'US',
        name: 'United States',
        nameEn: 'United States',
        nameDe: 'Vereinigte Staaten',
        nameFr: 'États-Unis'
      };
      const mockResponse: V2Country = {
        id: countryId,
        code: 'US',
        name: 'United States',
        nameEn: 'United States',
        nameDe: 'Vereinigte Staaten',
        nameFr: 'États-Unis',
        medals: { gold: 10, silver: 8, bronze: 6, total: 24 },
        leaderboardRank: 1,
        athletes: []
      };

      let result: V2Country | undefined;
      service.updateCountry(countryId, payload).subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/countries/${countryId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
    }));

    it('should handle error on update', fakeAsync(() => {
      const countryId = 999;
      const payload: FormCountryPayload = {
        code: 'XX',
        name: 'Non-Existent'
      };

      let errorResponse: any;
      service.updateCountry(countryId, payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/countries/${countryId}`);
      req.flush('Country not found', { status: 404, statusText: 'Not Found' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(404);
    }));
  });

  describe('deleteCountry', () => {
    it('should send DELETE request with id', fakeAsync(() => {
      const countryId = 10;

      let completed = false;
      service.deleteCountry(countryId).subscribe(() => {
        completed = true;
      });

      const req = httpMock.expectOne(`${API_URL}/countries/${countryId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      tick();

      expect(completed).toBe(true);
    }));

    it('should handle error on delete', fakeAsync(() => {
      const countryId = 50;

      let errorResponse: any;
      service.deleteCountry(countryId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/countries/${countryId}`);
      req.flush('Cannot delete country with athletes', { status: 400, statusText: 'Bad Request' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(400);
    }));
  });
});


