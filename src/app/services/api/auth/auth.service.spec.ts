import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { PLATFORM_ID } from '@angular/core';
import { API_URL, LoginResponse } from "../../../types/API";

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    localStorage.clear();
  });

  describe('constructor - browser platform', () => {
    it('should be created and restore session on browser platform', fakeAsync(() => {
      const mockResponse: LoginResponse = {
        id: 1,
        username: 'testuser',
        role: 'USER',
        message: 'Session restored'
      };

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule]
      });

      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);

      const req = httpMock.expectOne(`${API_URL}/auth/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);

      tick();

      expect(service).toBeTruthy();
      expect(service.currentUser()).toEqual({
        id: 1,
        username: 'testuser',
        role: 'USER'
      });
    }));

    it('should remove old localStorage auth_user on session restore', fakeAsync(() => {
      localStorage.setItem('auth_user', JSON.stringify({ username: 'old' }));

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule]
      });

      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);

      expect(localStorage.getItem('auth_user')).toBeNull();

      const req = httpMock.expectOne(`${API_URL}/auth/me`);
      req.flush({ id: 1, username: 'new', role: 'USER', message: 'OK' });

      tick();
    }));

    it('should set currentUser to null when session restore fails', fakeAsync(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule]
      });

      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);

      const req = httpMock.expectOne(`${API_URL}/auth/me`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(service.currentUser()).toBeNull();
    }));
  });

  describe('constructor - server platform', () => {
    it('should not restore session on server platform', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
      });

      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);

      httpMock.expectNone(`${API_URL}/auth/me`);
      expect(service).toBeTruthy();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
      });
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should send POST request and persist user on success', fakeAsync(() => {
      const mockResponse: LoginResponse = {
        id: 5,
        username: 'johndoe',
        role: 'ADMIN',
        message: 'Login successful'
      };

      let result: LoginResponse | undefined;
      service.login('johndoe', 'password123').subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'johndoe', password: 'password123' });
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
      expect(service.currentUser()).toEqual({
        id: 5,
        username: 'johndoe',
        role: 'ADMIN'
      });
    }));

    it('should handle login error', fakeAsync(() => {
      let errorResponse: any;
      service.login('wronguser', 'wrongpass').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/auth/login`);
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(401);
      expect(service.currentUser()).toBeNull();
    }));
  });

  describe('register', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
      });
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should send POST request and persist user on success', fakeAsync(() => {
      const mockResponse: LoginResponse = {
        id: 10,
        username: 'newuser',
        role: 'USER',
        message: 'Registration successful'
      };

      let result: LoginResponse | undefined;
      service.register('newuser', 'newpass123').subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'newuser', password: 'newpass123' });
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
      expect(service.currentUser()).toEqual({
        id: 10,
        username: 'newuser',
        role: 'USER'
      });
    }));

    it('should handle registration error', fakeAsync(() => {
      let errorResponse: any;
      service.register('existinguser', 'pass').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/auth/register`);
      req.flush('Username already exists', { status: 409, statusText: 'Conflict' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(409);
      expect(service.currentUser()).toBeNull();
    }));
  });

  describe('logout', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
      });
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should send POST request and clear currentUser', fakeAsync(() => {
      service.currentUser.set({ id: 1, username: 'testuser', role: 'USER' });

      let completed = false;
      service.logout().subscribe(() => {
        completed = true;
      });

      const req = httpMock.expectOne(`${API_URL}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);

      tick();

      expect(completed).toBe(true);
      expect(service.currentUser()).toBeNull();
    }));

    it('should handle logout error', fakeAsync(() => {
      service.currentUser.set({ id: 1, username: 'testuser', role: 'USER' });

      let errorResponse: any;
      service.logout().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/auth/logout`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(500);
    }));
  });

  describe('isLoggedIn', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
      });
      service = TestBed.inject(AuthService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should return true when user is set', () => {
      service.currentUser.set({ id: 1, username: 'user', role: 'USER' });
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false when user is null', () => {
      service.currentUser.set(null);
      expect(service.isLoggedIn()).toBe(false);
    });
  });
});

