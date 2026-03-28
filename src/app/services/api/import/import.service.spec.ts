import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImportService } from './import.service';
import { ImportResponse, ImportError } from '../../../types';
import { API_URL } from '../../../types';

describe('ImportService', () => {
  let service: ImportService;
  let httpMock: HttpTestingController;
  const apiBase = `${API_URL}/imports`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImportService]
    });
    service = TestBed.inject(ImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify that there are no outstanding HTTP requests
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('importCountries', () => {
    it('should send countries file to correct endpoint and return ImportResponse', () => {
      const mockFile = new File(['test'], 'countries.csv', { type: 'text/csv' });
      const mockResponse: ImportResponse = {
        status: 'COMPLETED',
        importType: 'COUNTRIES',
        filename: 'countries.csv',
        totalRecords: 10,
        successfulRecords: 10,
        failedRecords: 0,
        message: 'Import successful'
      };

      service.importCountries(mockFile).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.status).toBe('COMPLETED');
        expect(response.importType).toBe('COUNTRIES');
      });

      const req = httpMock.expectOne(`${apiBase}/countries`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle partial import response for countries', () => {
      const mockFile = new File(['test'], 'countries.csv', { type: 'text/csv' });
      const mockResponse: ImportResponse = {
        status: 'PARTIAL',
        importType: 'COUNTRIES',
        filename: 'countries.csv',
        totalRecords: 10,
        successfulRecords: 8,
        failedRecords: 2,
        message: 'Partial import',
        errors: [
          {
            rowNumber: 2,
            errorCode: 'DUPLICATE',
            errorMessage: 'Country already exists',
            fieldName: 'countryCode'
          }
        ]
      };

      service.importCountries(mockFile).subscribe((response) => {
        expect(response.status).toBe('PARTIAL');
        expect(response.failedRecords).toBe(2);
        expect(response.errors).toHaveLength(1);
      });

      const req = httpMock.expectOne(`${apiBase}/countries`);
      req.flush(mockResponse);
    });

    it('should handle failed import response for countries', () => {
      const mockFile = new File(['test'], 'countries.csv', { type: 'text/csv' });
      const mockResponse: ImportResponse = {
        status: 'FAILED',
        importType: 'COUNTRIES',
        filename: 'countries.csv',
        totalRecords: 10,
        successfulRecords: 0,
        failedRecords: 10,
        message: 'Import failed: Invalid file format'
      };

      service.importCountries(mockFile).subscribe((response) => {
        expect(response.status).toBe('FAILED');
        expect(response.successfulRecords).toBe(0);
      });

      const req = httpMock.expectOne(`${apiBase}/countries`);
      req.flush(mockResponse);
    });
  });

  describe('importAthletes', () => {
    it('should send athletes file to correct endpoint and return ImportResponse', () => {
      const mockFile = new File(['test'], 'athletes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse: ImportResponse = {
        status: 'COMPLETED',
        importType: 'ATHLETES',
        filename: 'athletes.xlsx',
        totalRecords: 25,
        successfulRecords: 25,
        failedRecords: 0,
        message: 'Import successful'
      };

      service.importAthletes(mockFile).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.importType).toBe('ATHLETES');
      });

      const req = httpMock.expectOne(`${apiBase}/athletes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle partial import response for athletes', () => {
      const mockFile = new File(['test'], 'athletes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse: ImportResponse = {
        status: 'PARTIAL',
        importType: 'ATHLETES',
        filename: 'athletes.xlsx',
        totalRecords: 25,
        successfulRecords: 23,
        failedRecords: 2,
        message: 'Partial import',
        errors: [
          {
            rowNumber: 5,
            errorCode: 'INVALID_FORMAT',
            errorMessage: 'Invalid date format',
            fieldName: 'birthDate',
            fieldValue: 'invalid-date'
          }
        ]
      };

      service.importAthletes(mockFile).subscribe((response) => {
        expect(response.status).toBe('PARTIAL');
        expect(response.errors?.[0].fieldValue).toBe('invalid-date');
      });

      const req = httpMock.expectOne(`${apiBase}/athletes`);
      req.flush(mockResponse);
    });

    it('should handle failed import response for athletes', () => {
      const mockFile = new File(['test'], 'athletes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse: ImportResponse = {
        status: 'FAILED',
        importType: 'ATHLETES',
        filename: 'athletes.xlsx',
        totalRecords: 25,
        successfulRecords: 0,
        failedRecords: 25,
        message: 'Import failed: File corrupted'
      };

      service.importAthletes(mockFile).subscribe((response) => {
        expect(response.status).toBe('FAILED');
        expect(response.failedRecords).toBe(25);
      });

      const req = httpMock.expectOne(`${apiBase}/athletes`);
      req.flush(mockResponse);
    });
  });

  describe('importResults', () => {
    it('should send results file to correct endpoint and return ImportResponse', () => {
      const mockFile = new File(['test'], 'results.csv', { type: 'text/csv' });
      const mockResponse: ImportResponse = {
        status: 'COMPLETED',
        importType: 'RESULTS',
        filename: 'results.csv',
        totalRecords: 50,
        successfulRecords: 50,
        failedRecords: 0,
        message: 'Import successful'
      };

      service.importResults(mockFile).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.importType).toBe('RESULTS');
      });

      const req = httpMock.expectOne(`${apiBase}/results`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle partial import response for results', () => {
      const mockFile = new File(['test'], 'results.csv', { type: 'text/csv' });
      const mockResponse: ImportResponse = {
        status: 'PARTIAL',
        importType: 'RESULTS',
        filename: 'results.csv',
        totalRecords: 50,
        successfulRecords: 48,
        failedRecords: 2,
        message: 'Partial import',
        errors: [
          {
            rowNumber: 10,
            errorCode: 'MISSING_FIELD',
            errorMessage: 'Required field missing',
            fieldName: 'athleteId'
          }
        ]
      };

      service.importResults(mockFile).subscribe((response) => {
        expect(response.status).toBe('PARTIAL');
        expect(response.successfulRecords).toBe(48);
      });

      const req = httpMock.expectOne(`${apiBase}/results`);
      req.flush(mockResponse);
    });

    it('should handle failed import response for results', () => {
      const mockFile = new File(['test'], 'results.csv', { type: 'text/csv' });
      const mockResponse: ImportResponse = {
        status: 'FAILED',
        importType: 'RESULTS',
        filename: 'results.csv',
        totalRecords: 50,
        successfulRecords: 0,
        failedRecords: 50,
        message: 'Import failed: No valid records found'
      };

      service.importResults(mockFile).subscribe((response) => {
        expect(response.status).toBe('FAILED');
      });

      const req = httpMock.expectOne(`${apiBase}/results`);
      req.flush(mockResponse);
    });
  });

  describe('FormData handling', () => {
    it('should append file correctly to FormData for importCountries', () => {
      const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const mockResponse: ImportResponse = {
        status: 'COMPLETED',
        importType: 'COUNTRIES',
        filename: 'test.csv',
        totalRecords: 1,
        successfulRecords: 1,
        failedRecords: 0,
        message: 'Success'
      };

      service.importCountries(mockFile).subscribe();

      const req = httpMock.expectOne(`${apiBase}/countries`);
      const body = req.request.body as FormData;
      expect(body.get('file')).toBe(mockFile);
      req.flush(mockResponse);
    });

    it('should append file correctly to FormData for importAthletes', () => {
      const mockFile = new File(['test content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockResponse: ImportResponse = {
        status: 'COMPLETED',
        importType: 'ATHLETES',
        filename: 'test.xlsx',
        totalRecords: 1,
        successfulRecords: 1,
        failedRecords: 0,
        message: 'Success'
      };

      service.importAthletes(mockFile).subscribe();

      const req = httpMock.expectOne(`${apiBase}/athletes`);
      const body = req.request.body as FormData;
      expect(body.get('file')).toBe(mockFile);
      req.flush(mockResponse);
    });

    it('should append file correctly to FormData for importResults', () => {
      const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const mockResponse: ImportResponse = {
        status: 'COMPLETED',
        importType: 'RESULTS',
        filename: 'test.csv',
        totalRecords: 1,
        successfulRecords: 1,
        failedRecords: 0,
        message: 'Success'
      };

      service.importResults(mockFile).subscribe();

      const req = httpMock.expectOne(`${apiBase}/results`);
      const body = req.request.body as FormData;
      expect(body.get('file')).toBe(mockFile);
      req.flush(mockResponse);
    });
  });

  describe('HTTP error handling', () => {
    it('should handle HTTP errors for importCountries', () => {
      const mockFile = new File(['test'], 'countries.csv', { type: 'text/csv' });

      service.importCountries(mockFile).subscribe(
        () => fail('should have failed with 500 error'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${apiBase}/countries`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors for importAthletes', () => {
      const mockFile = new File(['test'], 'athletes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      service.importAthletes(mockFile).subscribe(
        () => fail('should have failed with 400 error'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${apiBase}/athletes`);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle HTTP errors for importResults', () => {
      const mockFile = new File(['test'], 'results.csv', { type: 'text/csv' });

      service.importResults(mockFile).subscribe(
        () => fail('should have failed with 503 error'),
        (error) => {
          expect(error.status).toBe(503);
        }
      );

      const req = httpMock.expectOne(`${apiBase}/results`);
      req.flush('Service unavailable', { status: 503, statusText: 'Service Unavailable' });
    });
  });
});

