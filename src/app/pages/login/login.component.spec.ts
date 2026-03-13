import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PLATFORM_ID } from "@angular/core";
import { AuthService } from "../../services/api/auth/auth.service";
import { AlertService } from "../../services/api/alert/alert.service";
import { defer } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";
import { LoginResponse } from "../../types/API";

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let alertService: AlertService;
  let router: Router;
  let translateService: TranslateService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [{ provide: ActivatedRoute, useValue: {} }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    alertService = TestBed.inject(AlertService);
    router = TestBed.inject(Router);
    translateService = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor - browser platform', () => {
    it('should set skipEntryAnimation to false when document is not complete', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading'
      });

      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(false);
    });

    it('should set skipEntryAnimation to true when document is complete', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });

      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(true);
    });
  });

  describe('constructor - server platform', () => {
    it('should not check document.readyState on server platform', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [LoginComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [
          { provide: ActivatedRoute, useValue: {} },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(false);
    });
  });

  describe('onLogin', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when cookies are not allowed (null)', () => {
      localStorage.removeItem('allow_cookies');
      jest.spyOn(translateService, 'instant').mockReturnValue('Please accept cookies');

      component['onLogin']();

      expect(component['loginError']()).toBe('Please accept cookies');
    });

    it('should show error when cookies are not allowed (false)', () => {
      localStorage.setItem('allow_cookies', 'false');
      jest.spyOn(translateService, 'instant').mockReturnValue('Cookie error');

      component['onLogin']();

      expect(component['loginError']()).toBe('Cookie error');
    });

    it('should show error when username is empty', () => {
      localStorage.setItem('allow_cookies', 'true');
      component['loginData'].set({ username: '   ', password: 'test123' });
      jest.spyOn(translateService, 'instant').mockReturnValue('Incomplete data');

      component['onLogin']();

      expect(component['loginError']()).toBe('Incomplete data');
    });

    it('should show error when password is empty', () => {
      localStorage.setItem('allow_cookies', 'true');
      component['loginData'].set({ username: 'testuser', password: '' });
      jest.spyOn(translateService, 'instant').mockReturnValue('Incomplete data');

      component['onLogin']();

      expect(component['loginError']()).toBe('Incomplete data');
    });

    it('should clear previous errors and set loading state', fakeAsync(() => {
      localStorage.setItem('allow_cookies', 'true');
      component['loginData'].set({ username: 'user', password: 'pass' });
      component['loginError'].set('Old error');

      const mockResponse: LoginResponse = {
        id: 1,
        username: 'user',
        role: 'USER',
        message: 'OK'
      };
      jest.spyOn(authService, 'login').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      jest.spyOn(router, 'navigate').mockResolvedValue(true);

      component['onLogin']();

      expect(component['loginError']()).toBe('');
      expect(component['isLoading']()).toBe(true);

      tick();
    }));

    it('should navigate to home and show success alert on successful login', fakeAsync(() => {
      localStorage.setItem('allow_cookies', 'true');
      component['loginData'].set({ username: 'testuser', password: 'testpass' });

      const mockResponse: LoginResponse = {
        id: 1,
        username: 'testuser',
        role: 'USER',
        message: 'Login successful'
      };

      authService.currentUser.set({ id: 1, username: 'testuser', role: 'USER' });
      jest.spyOn(authService, 'login').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      jest.spyOn(router, 'navigate').mockResolvedValue(true);
      jest.spyOn(translateService, 'instant').mockReturnValue('Welcome [name]');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onLogin']();

      tick();

      expect(authService.login).toHaveBeenCalledWith('testuser', 'testpass');
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      tick();

      expect(alertSpy).toHaveBeenCalledWith('Welcome testuser');
    }));

    it('should show error message on login failure', fakeAsync(() => {
      localStorage.setItem('allow_cookies', 'true');
      component['loginData'].set({ username: 'wronguser', password: 'wrongpass' });

      const mockError = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      jest.spyOn(authService, 'login').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValue('Invalid credentials');

      component['onLogin']();

      expect(component['isLoading']()).toBe(true);

      tick();

      expect(component['isLoading']()).toBe(false);
      expect(component['loginError']()).toBe('Invalid credentials');
    }));
  });

  describe('onRegisterModalOpen', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear previous errors', () => {
      localStorage.setItem('allow_cookies', 'true');
      component['loginError'].set('Previous error');

      component['onRegisterModalOpen']();

      expect(component['loginError']()).toBe('');
    });

    it('should show error alert when cookies are not allowed (null)', () => {
      localStorage.removeItem('allow_cookies');
      jest.spyOn(translateService, 'instant').mockReturnValue('Cookie error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      component['onRegisterModalOpen']();

      expect(alertSpy).toHaveBeenCalledWith('Cookie error');
      expect(component['isRegisterModalOpen']()).toBe(false);
    });

    it('should show error alert when cookies are not allowed (false)', () => {
      localStorage.setItem('allow_cookies', 'false');
      jest.spyOn(translateService, 'instant').mockReturnValue('Cookie error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      component['onRegisterModalOpen']();

      expect(alertSpy).toHaveBeenCalledWith('Cookie error');
      expect(component['isRegisterModalOpen']()).toBe(false);
    });

    it('should open register modal when cookies are allowed', () => {
      localStorage.setItem('allow_cookies', 'true');

      component['onRegisterModalOpen']();

      expect(component['isRegisterModalOpen']()).toBe(true);
    });
  });

  describe('onRegister', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear previous errors and set loading state', fakeAsync(() => {
      component['loginError'].set('Old error');

      const mockResponse: LoginResponse = {
        id: 2,
        username: 'newuser',
        role: 'USER',
        message: 'Registered'
      };
      jest.spyOn(authService, 'register').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      jest.spyOn(router, 'navigate').mockResolvedValue(true);

      component['onRegister']({ username: 'newuser', password: 'pass123', confirmPassword: 'pass123' });

      expect(component['loginError']()).toBe('');
      expect(component['isLoading']()).toBe(true);

      tick();
    }));

    it('should navigate to home and show success alert on successful registration', fakeAsync(() => {
      const mockResponse: LoginResponse = {
        id: 2,
        username: 'newuser',
        role: 'USER',
        message: 'Registration successful'
      };

      authService.currentUser.set({ id: 2, username: 'newuser', role: 'USER' });
      jest.spyOn(authService, 'register').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      jest.spyOn(router, 'navigate').mockResolvedValue(true);
      jest.spyOn(translateService, 'instant').mockReturnValue('Welcome [name]');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onRegister']({ username: 'newuser', password: 'newpass', confirmPassword: 'newpass' });

      tick();

      expect(authService.register).toHaveBeenCalledWith('newuser', 'newpass');
      expect(router.navigate).toHaveBeenCalledWith(['/']);

      tick();

      expect(alertSpy).toHaveBeenCalledWith('Welcome newuser');
    }));

    it('should show conflict error on 409 status', fakeAsync(() => {
      const mockError = new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict',
        error: { message: 'User exists' }
      });

      jest.spyOn(authService, 'register').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValueOnce('Username already exists');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      component['onRegister']({ username: 'existinguser', password: 'pass', confirmPassword: 'pass' });

      expect(component['isLoading']()).toBe(true);

      tick();

      expect(component['isLoading']()).toBe(false);
      expect(alertSpy).toHaveBeenCalledWith('Username already exists');
    }));

    it('should show conflict error when error message contains "exists"', fakeAsync(() => {
      const mockError = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: 'Username already exists in database' }
      });

      jest.spyOn(authService, 'register').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValueOnce('Conflict error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      component['onRegister']({ username: 'duplicate', password: 'pass', confirmPassword: 'pass' });

      tick();

      expect(alertSpy).toHaveBeenCalledWith('Conflict error');
    }));

    it('should show generic error on non-conflict registration failure', fakeAsync(() => {
      const mockError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });

      jest.spyOn(authService, 'register').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValueOnce('Generic error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      component['onRegister']({ username: 'testuser', password: 'pass', confirmPassword: 'pass' });

      tick();

      expect(component['isLoading']()).toBe(false);
      expect(alertSpy).toHaveBeenCalledWith('Generic error');
    }));
  });
});
