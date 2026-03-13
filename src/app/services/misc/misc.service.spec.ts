import { TestBed } from '@angular/core/testing';
import { MiscService } from './misc.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { DataHolderService } from "../data-holder/data-holder.service";
import { signal, WritableSignal } from "@angular/core";
import { V2Athlete } from "../../types/Athlete";
import { CountryStats } from "../../types/Country";

describe('MiscService', () => {
  let service: MiscService;
  let dataHolderService: DataHolderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()]
    });
    service = TestBed.inject(MiscService);
    dataHolderService = TestBed.inject(DataHolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct navigation items', () => {
    expect(service.nav_items).toHaveLength(3);
    expect(service.nav_items[0]).toEqual({ label: 'BREADCRUMB.NAVIGATION.START', path: '/' });
    expect(service.nav_items[1]).toEqual({ label: 'BREADCRUMB.NAVIGATION.DETAILED', path: '/detailed' });
    expect(service.nav_items[2]).toEqual({
      label: 'BREADCRUMB.NAVIGATION.LEARNMORE',
      externalUrl: 'https://www.olympics.com/de/olympic-games/paris-2024'
    });
  });

  describe('onBackdropClick', () => {
    it('should call close function when clicking on backdrop itself', () => {
      let mockEvent = {
        target: document.createElement('div'),
        currentTarget: document.createElement('div')
      } as any;
      mockEvent.target = mockEvent.currentTarget;
      const closeFn = jest.fn();

      service.onBackdropClick(mockEvent, closeFn);

      expect(closeFn).toHaveBeenCalledTimes(1);
    });

    it('should not call close function when clicking inside modal content', () => {
      const backdrop = document.createElement('div');
      const content = document.createElement('div');
      const mockEvent = {
        target: content,
        currentTarget: backdrop
      } as unknown as MouseEvent;
      const closeFn = jest.fn();

      service.onBackdropClick(mockEvent, closeFn);

      expect(closeFn).not.toHaveBeenCalled();
    });
  });

  describe('updateField', () => {
    it('should update a single field in a signal-based form', () => {
      interface TestForm {
        name: string;
        age: number;
      }
      const formSignal: WritableSignal<TestForm> = signal<TestForm>({ name: 'John', age: 25 });

      service.updateField(formSignal, 'name', 'Jane');

      expect(formSignal().name).toBe('Jane');
      expect(formSignal().age).toBe(25);
    });

    it('should update multiple fields sequentially', () => {
      interface TestForm {
        email: string;
        verified: boolean;
      }
      const formSignal: WritableSignal<TestForm> = signal<TestForm>({ email: 'old@test.com', verified: false });

      service.updateField(formSignal, 'email', 'new@test.com');
      service.updateField(formSignal, 'verified', true);

      expect(formSignal().email).toBe('new@test.com');
      expect(formSignal().verified).toBe(true);
    });
  });

  describe('getRankOf', () => {
    it('should return correct rank for item with matching id', () => {
      const sortedList = [
        { id: 10, name: 'First' },
        { id: 20, name: 'Second' },
        { id: 30, name: 'Third' }
      ];

      const rank = service.getRankOf(sortedList, 20, 'id');

      expect(rank).toBe(1);
    });

    it('should return 0 for first item', () => {
      const sortedList = [
        { id: 5, value: 'A' },
        { id: 10, value: 'B' }
      ];

      const rank = service.getRankOf(sortedList, 5, 'id');

      expect(rank).toBe(0);
    });

    it('should return -1 when id is not found', () => {
      const sortedList = [
        { id: 1, data: 'test' },
        { id: 2, data: 'test2' }
      ];

      const rank = service.getRankOf(sortedList, 999, 'id');

      expect(rank).toBe(-1);
    });

    it('should work with custom id key like countryId', () => {
      const sortedList = [
        { countryId: 100, name: 'USA' },
        { countryId: 200, name: 'Germany' },
        { countryId: 300, name: 'France' }
      ];

      const rank = service.getRankOf(sortedList, 300, 'countryId');

      expect(rank).toBe(2);
    });

    it('should return -1 for empty list', () => {
      const sortedList: any[] = [];

      const rank = service.getRankOf(sortedList, 1, 'id');

      expect(rank).toBe(-1);
    });
  });

  describe('recalcCountryMedals', () => {
    it('should recalculate medals for a specific country', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: {
            id: 1,
            code: 'US',
            name: 'USA',
            nameEn: 'USA',
            nameDe: 'USA',
            nameFr: 'USA',
            medals: {gold: 0, silver: 0, bronze: 0}
          },
          sports: [],
          medals: {gold: 2, silver: 1, bronze: 0}
        } as unknown as V2Athlete,
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          country: { id: 1, code: 'US', name: 'USA', nameEn: 'USA', nameDe: 'USA', nameFr: 'USA', medals: { gold: 0, silver: 0, bronze: 0 } },
          sports: [],
          medals: { gold: 1, silver: 2, bronze: 1 }
        } as unknown as V2Athlete,
        {
          id: 3,
          firstName: 'Max',
          lastName: 'Müller',
          country: { id: 2, code: 'DE', name: 'Germany', nameEn: 'Germany', nameDe: 'Deutschland', nameFr: 'Allemagne', medals: { gold: 0, silver: 0, bronze: 0 } },
          sports: [],
          medals: { gold: 0, silver: 0, bronze: 2 }
        } as unknown as V2Athlete
      ];

      const mockCountries: CountryStats[] = [
        {
          countryId: 1,
          countryCode: 'US',
          countryName: 'USA',
          medals: { gold: 0, silver: 0, bronze: 0 },
          nameEn: 'USA',
          nameDe: 'USA',
          nameFr: 'USA'
        },
        {
          countryId: 2,
          countryCode: 'DE',
          countryName: 'Germany',
          medals: { gold: 0, silver: 0, bronze: 0 },
          nameEn: 'Germany',
          nameDe: 'Deutschland',
          nameFr: 'Allemagne'
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.countriesData.set(mockCountries);

      service.recalcCountryMedals(1);

      const updatedCountries = dataHolderService.countriesData();
      const usaCountry = updatedCountries.find(c => c.countryId === 1);

      expect(usaCountry?.medals.gold).toBe(3);
      expect(usaCountry?.medals.silver).toBe(3);
      expect(usaCountry?.medals.bronze).toBe(1);
    });

    it('should not modify other countries when recalculating one country', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: {
            id: 1,
            code: 'US',
            name: 'USA',
            nameEn: 'USA',
            nameDe: 'USA',
            nameFr: 'USA',
            medals: {gold: 0, silver: 0, bronze: 0}
          },
          sports: [],
          medals: {gold: 1, silver: 0, bronze: 0}
        } as unknown as V2Athlete
      ];

      const mockCountries: CountryStats[] = [
        {
          countryId: 1,
          countryCode: 'US',
          countryName: 'USA',
          medals: { gold: 0, silver: 0, bronze: 0 },
          nameEn: 'USA',
          nameDe: 'USA',
          nameFr: 'USA'
        },
        {
          countryId: 2,
          countryCode: 'DE',
          countryName: 'Germany',
          medals: { gold: 5, silver: 3, bronze: 2 },
          nameEn: 'Germany',
          nameDe: 'Deutschland',
          nameFr: 'Allemagne'
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.countriesData.set(mockCountries);

      service.recalcCountryMedals(1);

      const updatedCountries = dataHolderService.countriesData();
      const germanyCountry = updatedCountries.find(c => c.countryId === 2);

      expect(germanyCountry?.medals.gold).toBe(5);
      expect(germanyCountry?.medals.silver).toBe(3);
      expect(germanyCountry?.medals.bronze).toBe(2);
    });

    it('should handle country with no athletes', () => {
      const mockAthletes: V2Athlete[] = [];

      const mockCountries: CountryStats[] = [
        {
          countryId: 1,
          countryCode: 'US',
          countryName: 'USA',
          medals: { gold: 10, silver: 5, bronze: 3 },
          nameEn: 'USA',
          nameDe: 'USA',
          nameFr: 'USA'
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.countriesData.set(mockCountries);

      service.recalcCountryMedals(1);

      const updatedCountries = dataHolderService.countriesData();
      const usaCountry = updatedCountries.find(c => c.countryId === 1);

      expect(usaCountry?.medals.gold).toBe(0);
      expect(usaCountry?.medals.silver).toBe(0);
      expect(usaCountry?.medals.bronze).toBe(0);
    });

    it('should return early when countryId is falsy', () => {
      const updateSpy = jest.spyOn(dataHolderService.countriesData, 'update');

      service.recalcCountryMedals(0);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should handle null or undefined medal values', () => {
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          country: {
            id: 1,
            code: 'US',
            name: 'USA',
            nameEn: 'USA',
            nameDe: 'USA',
            nameFr: 'USA',
            medals: {gold: 0, silver: 0, bronze: 0}
          },
          sports: [],
          medals: {gold: null as any, silver: undefined as any, bronze: null as any}
        } as unknown as V2Athlete
      ];

      const mockCountries: CountryStats[] = [
        {
          countryId: 1,
          countryCode: 'US',
          countryName: 'USA',
          medals: { gold: 0, silver: 0, bronze: 0 },
          nameEn: 'USA',
          nameDe: 'USA',
          nameFr: 'USA'
        }
      ];

      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.countriesData.set(mockCountries);

      service.recalcCountryMedals(1);

      const updatedCountries = dataHolderService.countriesData();
      const usaCountry = updatedCountries.find(c => c.countryId === 1);

      expect(usaCountry?.medals.gold).toBe(0);
      expect(usaCountry?.medals.silver).toBe(0);
      expect(usaCountry?.medals.bronze).toBe(0);
    });
  });
});
