import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { CookieBannerComponent } from './cookie-banner.component';

describe('CookieBannerComponent', () => {
  let component: CookieBannerComponent;
  let fixture: ComponentFixture<CookieBannerComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CookieBannerComponent],
    }).compileComponents();
  });

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CookieBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should show the banner after 50ms when allow_cookies is missing or not true', fakeAsync(() => {
    createComponent();

    expect((component as any).isVisible()).toBe(false);
    tick(50);
    expect((component as any).isVisible()).toBe(true);

    localStorage.setItem('allow_cookies', 'false');
    const secondFixture = TestBed.createComponent(CookieBannerComponent);
    const secondComponent = secondFixture.componentInstance;
    secondFixture.detectChanges();

    expect((secondComponent as any).isVisible()).toBe(false);
    tick(50);
    expect((secondComponent as any).isVisible()).toBe(true);
  }));

  it('should keep banner hidden when allow_cookies is true', fakeAsync(() => {
    localStorage.setItem('allow_cookies', 'true');
    createComponent();

    tick(100);
    expect((component as any).isVisible()).toBe(false);
  }));

  it('should store consent and finish leave animation on accept in browser', fakeAsync(() => {
    createComponent();

    tick(50);
    expect((component as any).isVisible()).toBe(true);

    (component as any).accept();

    expect(localStorage.getItem('allow_cookies')).toBe('true');
    expect((component as any).isLeaving()).toBe(true);

    tick(300);
    expect((component as any).isVisible()).toBe(false);
    expect((component as any).isLeaving()).toBe(false);
  }));
});

describe('CookieBannerComponent (server platform)', () => {
  let component: CookieBannerComponent;
  let fixture: ComponentFixture<CookieBannerComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CookieBannerComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should skip browser-only constructor branch and not write localStorage on server platform', fakeAsync(() => {
    tick(100);
    expect((component as any).isVisible()).toBe(false);

    (component as any).accept();
    expect(localStorage.getItem('allow_cookies')).toBeNull();
    expect((component as any).isLeaving()).toBe(true);

    tick(300);
    expect((component as any).isVisible()).toBe(false);
    expect((component as any).isLeaving()).toBe(false);
  }));
});
