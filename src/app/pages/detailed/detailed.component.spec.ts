import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DetailedComponent } from './detailed.component';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ActivatedRoute } from "@angular/router";
import { PLATFORM_ID } from "@angular/core";
import { DataHolderService } from "../../services/data-holder/data-holder.service";
import { Subject } from "rxjs";

describe('DetailedComponent', () => {
  let component: DetailedComponent;
  let fixture: ComponentFixture<DetailedComponent>;
  let dataHolderService: DataHolderService;
  let translateService: TranslateService;

  describe('constructor - browser platform', () => {
    it('should set skipEntryAnimation to false when document is not complete and load data', fakeAsync(() => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading'
      });

      TestBed.configureTestingModule({
        imports: [DetailedComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [{ provide: ActivatedRoute, useValue: {} }]
      });

      dataHolderService = TestBed.inject(DataHolderService);
      const loadSpy = jest.spyOn(dataHolderService, 'load').mockImplementation();

      fixture = TestBed.createComponent(DetailedComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(false);
      expect(loadSpy).toHaveBeenCalledTimes(1);

      tick();
    }));

    it('should set skipEntryAnimation to true when document is complete', fakeAsync(() => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });

      TestBed.configureTestingModule({
        imports: [DetailedComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [{ provide: ActivatedRoute, useValue: {} }]
      });

      dataHolderService = TestBed.inject(DataHolderService);
      jest.spyOn(dataHolderService, 'load').mockImplementation();

      fixture = TestBed.createComponent(DetailedComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(true);

      tick();
    }));

    it('should subscribe to language changes and reload data', fakeAsync(() => {
      const langChangeSubject = new Subject<any>();

      TestBed.configureTestingModule({
        imports: [DetailedComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [{ provide: ActivatedRoute, useValue: {} }]
      });

      dataHolderService = TestBed.inject(DataHolderService);
      translateService = TestBed.inject(TranslateService);

      const loadSpy = jest.spyOn(dataHolderService, 'load').mockImplementation();
      Object.defineProperty(translateService, 'onLangChange', {
        value: langChangeSubject.asObservable()
      });

      fixture = TestBed.createComponent(DetailedComponent);
      component = fixture.componentInstance;

      tick();

      expect(loadSpy).toHaveBeenCalledTimes(1);

      langChangeSubject.next({ lang: 'de' });

      tick();

      expect(loadSpy).toHaveBeenCalledTimes(2);
    }));

    it('should trigger animation when selectedView changes', fakeAsync(() => {
      TestBed.configureTestingModule({
        imports: [DetailedComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [{ provide: ActivatedRoute, useValue: {} }]
      });

      dataHolderService = TestBed.inject(DataHolderService);
      jest.spyOn(dataHolderService, 'load').mockImplementation();

      fixture = TestBed.createComponent(DetailedComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      let previousTrigger = component['animationTrigger']();

      component['selectedView'].set('athletes');
      fixture.detectChanges();
      tick();

      let currentTrigger = component['animationTrigger']();
      expect(currentTrigger).toBe(previousTrigger + 1);
      previousTrigger = currentTrigger;

      component['selectedView'].set('countries');
      fixture.detectChanges();
      tick();

      currentTrigger = component['animationTrigger']();
      expect(currentTrigger).toBe(previousTrigger + 1);
      previousTrigger = currentTrigger;

      component['selectedView'].set('disciplines');
      fixture.detectChanges();
      tick();

      currentTrigger = component['animationTrigger']();
      expect(currentTrigger).toBe(previousTrigger + 1);
    }));
  });

  describe('constructor - server platform', () => {
    it('should not check document.readyState on server platform', async () => {
      await TestBed.configureTestingModule({
        imports: [DetailedComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [
          { provide: ActivatedRoute, useValue: {} },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      }).compileComponents();

      dataHolderService = TestBed.inject(DataHolderService);
      jest.spyOn(dataHolderService, 'load').mockImplementation();

      fixture = TestBed.createComponent(DetailedComponent);
      component = fixture.componentInstance;

      expect(component['skipEntryAnimation']).toBe(false);
    });
  });

  describe('signals', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DetailedComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [{ provide: ActivatedRoute, useValue: {} }]
      }).compileComponents();

      dataHolderService = TestBed.inject(DataHolderService);
      jest.spyOn(dataHolderService, 'load').mockImplementation();

      fixture = TestBed.createComponent(DetailedComponent);
      component = fixture.componentInstance;
    });

    it('should initialize with default values', () => {
      expect(component['selectedView']()).toBe('disciplines');
      expect(component['filterCountry']()).toBe('all');
      expect(component['filterSport']()).toBe('all');
      expect(component['filterMedal']()).toBe('all');
      expect(component['searchQuery']()).toBe('');
      expect(component['animationTrigger']()).toBeGreaterThanOrEqual(0);
    });

    it('should allow updating signal values', () => {
      component['selectedView'].set('athletes');
      expect(component['selectedView']()).toBe('athletes');

      component['filterCountry'].set('US');
      expect(component['filterCountry']()).toBe('US');

      component['filterSport'].set('swimming');
      expect(component['filterSport']()).toBe('swimming');

      component['filterMedal'].set('gold');
      expect(component['filterMedal']()).toBe('gold');

      component['searchQuery'].set('test query');
      expect(component['searchQuery']()).toBe('test query');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from translateSub when it exists', fakeAsync(() => {
      TestBed.configureTestingModule({
        imports: [DetailedComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [{ provide: ActivatedRoute, useValue: {} }]
      });

      dataHolderService = TestBed.inject(DataHolderService);
      jest.spyOn(dataHolderService, 'load').mockImplementation();

      fixture = TestBed.createComponent(DetailedComponent);
      component = fixture.componentInstance;
      tick();

      const unsubscribeSpy = jest.spyOn(component['translateSub'], 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    }));

    it('should not throw error when translateSub is undefined', async () => {
      await TestBed.configureTestingModule({
        imports: [DetailedComponent, HttpClientTestingModule, TranslateModule.forRoot()],
        providers: [
          { provide: ActivatedRoute, useValue: {} },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      }).compileComponents();

      dataHolderService = TestBed.inject(DataHolderService);
      jest.spyOn(dataHolderService, 'load').mockImplementation();

      fixture = TestBed.createComponent(DetailedComponent);
      component = fixture.componentInstance;

      (component as any).translateSub = undefined;

      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });
});
