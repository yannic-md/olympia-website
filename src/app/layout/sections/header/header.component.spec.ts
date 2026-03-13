import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { defer } from 'rxjs';

import { HeaderComponent } from './header.component';
import { MiscService } from '../../../services/misc/misc.service';
import { AuthService } from '../../../services/api/auth/auth.service';
import { AlertService } from '../../../services/api/alert/alert.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: AuthService;
  let alertService: AlertService;
  let router: Router;
  let translateService: TranslateService;

  const createComponent = (): void => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: MiscService, useValue: {} },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: (): boolean => false,
            logout: () => defer(() => Promise.resolve({})),
            currentUser: signal(null),
          },
        },
        { provide: AlertService, useValue: { success: (): void => {} } },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    alertService = TestBed.inject(AlertService);
    router = TestBed.inject(Router);
    translateService = TestBed.inject(TranslateService);
  });

  it('should initialize language from localStorage and set skipEntryAnimation when document is complete', () => {
    localStorage.setItem('lang', 'English');
    jest.spyOn(document, 'readyState', 'get').mockReturnValue('complete');

    createComponent();

    expect(component['currentLanguage']).toBe('English');
    expect(component['skipEntryAnimation']).toBe(true);
  });

  it('should store the initial scroll position on init', () => {
    Object.defineProperty(window, 'pageYOffset', { value: 120, configurable: true });

    createComponent();
    fixture.detectChanges();

    expect(component['lastScrollPosition']).toBe(120);
  });

  it('should toggle and change language including fallback to german', () => {
    createComponent();
    const useSpy = jest.spyOn(translateService, 'use');
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

    component['toggleLanguageMenu']();
    expect(component['isLanguageMenuOpen']).toBe(true);

    component['changeLanguage']('French');
    expect(component['currentLanguage']).toBe('French');
    expect(useSpy).toHaveBeenLastCalledWith('fr');
    expect(component['isLanguageMenuOpen']).toBe(false);

    component['toggleLanguageMenu']();
    component['changeLanguage']('English');
    expect(useSpy).toHaveBeenLastCalledWith('en');

    component['toggleLanguageMenu']();
    component['changeLanguage']('Deutsch');
    expect(useSpy).toHaveBeenLastCalledWith('de');
    expect(setItemSpy).toHaveBeenLastCalledWith('lang', 'Deutsch');
  });

  it('should open mobile menu and close it with leave animation timing', fakeAsync(() => {
    createComponent();

    component['toggleMobileMenu']();
    expect(component['isMobileMenuOpen']).toBe(true);

    component['toggleMobileMenu']();
    expect(component['isMenuLeaving']).toBe(true);
    expect(component['isMobileMenuOpen']).toBe(true);

    tick(300);
    expect(component['isMobileMenuOpen']).toBe(false);
    expect(component['isMenuLeaving']).toBe(false);
  }));

  it('should navigate to login directly when logout is triggered while not logged in', () => {
    createComponent();
    const isLoggedInSpy = jest.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
    const logoutSpy = jest.spyOn(authService, 'logout');
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component['logout']();

    expect(isLoggedInSpy).toHaveBeenCalled();
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show success alert and navigate on successful logout', fakeAsync(() => {
    createComponent();
    jest.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    jest.spyOn(authService, 'logout').mockReturnValue(defer(() => Promise.resolve({})) as never);
    const instantSpy = jest.spyOn(translateService, 'instant').mockReturnValue('Logged out');
    const successSpy = jest.spyOn(alertService, 'success');
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component['logout']();
    tick();

    expect(instantSpy).toHaveBeenCalledWith('ALERT.LOGOUT');
    expect(successSpy).toHaveBeenCalledWith('Logged out');
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('should clear current user and navigate on logout error', fakeAsync(() => {
    createComponent();
    jest.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    jest.spyOn(authService, 'logout').mockReturnValue(defer(() => Promise.reject(new Error('fail'))) as never);
    const currentUserSetSpy = jest.spyOn(authService.currentUser, 'set');
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component['logout']();
    tick();

    expect(currentUserSetSpy).toHaveBeenCalledWith(null);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('should close menus only when clicking outside', () => {
    createComponent();
    const toggleMobileMenuSpy = jest.spyOn(component as never, 'toggleMobileMenu' as never);

    component['isLanguageMenuOpen'] = true;
    component['isMobileMenuOpen'] = true;

    const outsideTarget = { closest: jest.fn().mockReturnValue(null) } as unknown as HTMLElement;
    component.onDocumentClick({ target: outsideTarget } as unknown as MouseEvent);

    expect(component['isLanguageMenuOpen']).toBe(false);
    expect(toggleMobileMenuSpy).toHaveBeenCalledTimes(1);

    component['isLanguageMenuOpen'] = true;
    component['isMobileMenuOpen'] = true;
    toggleMobileMenuSpy.mockClear();

    const insideTarget = {
      closest: jest.fn((selector: string) => {
        if (selector === '.language-menu-container' || selector === '.mobile-menu-container') {
          return {};
        }
        return null;
      }),
    } as unknown as HTMLElement;

    component.onDocumentClick({ target: insideTarget } as unknown as MouseEvent);

    expect(component['isLanguageMenuOpen']).toBe(true);
    expect(toggleMobileMenuSpy).not.toHaveBeenCalled();
  });

  it('should update header visibility based on scroll direction and threshold', () => {
    createComponent();

    component['lastScrollPosition'] = 100;
    component['scrollThreshold'] = 50;

    Object.defineProperty(window, 'pageYOffset', { value: 140, configurable: true });
    component['onWindowScroll']();
    expect(component['showUpperPart']).toBe(false);
    expect(component['lastScrollPosition']).toBe(140);

    Object.defineProperty(window, 'pageYOffset', { value: 120, configurable: true });
    component['onWindowScroll']();
    expect(component['showUpperPart']).toBe(true);
    expect(component['lastScrollPosition']).toBe(120);

    Object.defineProperty(window, 'pageYOffset', { value: 30, configurable: true });
    component['onWindowScroll']();
    expect(component['showUpperPart']).toBe(true);
    expect(component['lastScrollPosition']).toBe(30);
  });

  it('should use documentElement.scrollTop fallback in ngOnInit and onWindowScroll', () => {
    Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 77, configurable: true });

    createComponent();
    fixture.detectChanges();
    expect(component['lastScrollPosition']).toBe(77);

    component['showUpperPart'] = false;
    component['lastScrollPosition'] = 100;

    Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 40, configurable: true });

    component['onWindowScroll']();

    expect(component['showUpperPart']).toBe(true);
    expect(component['lastScrollPosition']).toBe(40);
  });

  it('should not change visibility when current scroll value is not comparable to threshold checks', () => {
    createComponent();
    component['showUpperPart'] = false;
    component['lastScrollPosition'] = 10;
    component['scrollThreshold'] = 50;

    Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: Number.NaN, configurable: true });

    component['onWindowScroll']();

    expect(component['showUpperPart']).toBe(false);
    expect(component['lastScrollPosition']).toBeNaN();
  });
});

describe('HeaderComponent (server platform)', () => {
  it('should not enter browser-only ngOnInit logic on server platform', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: MiscService, useValue: {} },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: (): boolean => false,
            logout: () => defer(() => Promise.resolve({})),
            currentUser: signal(null),
          },
        },
        { provide: AlertService, useValue: { success: (): void => {} } },
      ],
    }).compileComponents();

    Object.defineProperty(window, 'pageYOffset', { value: 123, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 456, configurable: true });

    const serverFixture = TestBed.createComponent(HeaderComponent);
    const serverComponent = serverFixture.componentInstance;
    serverFixture.detectChanges();

    expect(serverComponent['lastScrollPosition']).toBe(0);
  });
});
