import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { DisciplinesViewComponent } from "./disciplines-view.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { DataHolderService } from "../../../../services/data-holder/data-holder.service";
import { AlertService } from "../../../../services/api/alert/alert.service";
import { ResultService } from "../../../../services/api/result/result.service";
import { V2Sport, ResultResponse } from "../../../../types/Disciplines";
import { V2Athlete } from "../../../../types/Athlete";
import { CountryStats } from "../../../../types/Country";
import { defer } from "rxjs";
import { HttpErrorResponse } from "@angular/common/http";

describe('DisciplinesViewComponent', () => {
  let component: DisciplinesViewComponent;
  let fixture: ComponentFixture<DisciplinesViewComponent>;
  let dataHolderService: DataHolderService;
  let alertService: AlertService;
  let translateService: TranslateService;
  let resultService: ResultService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisciplinesViewComponent, HttpClientTestingModule, TranslateModule.forRoot()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(DisciplinesViewComponent);
    component = fixture.componentInstance;
    dataHolderService = TestBed.inject(DataHolderService);
    alertService = TestBed.inject(AlertService);
    translateService = TestBed.inject(TranslateService);
    resultService = TestBed.inject(ResultService);

    fixture.componentRef.setInput('filterCountry', 'all');
    fixture.componentRef.setInput('filterSport', 'all');
    fixture.componentRef.setInput('filterMedal', 'all');
    fixture.componentRef.setInput('searchQuery', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('signals', () => {
    it('should initialize with default values', () => {
      expect(component['imageErrors']()).toEqual(new Set());
      expect(component['isDisciplineModalOpen']()).toBe(false);
      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['suspendedDisciplineForm']()).toBeNull();
      expect(component['suspendedAthleteForm']()).toBeNull();
    });
  });

  describe('onImageError', () => {
    it('should add rawName to imageErrors set', () => {
      component['onImageError']('swimming-100m');
      expect(component['imageErrors']().has('swimming-100m')).toBe(true);

      component['onImageError']('athletics-100m');
      expect(component['imageErrors']().has('athletics-100m')).toBe(true);
      expect(component['imageErrors']().size).toBe(2);
    });
  });

  describe('disciplineCards computed signal', () => {
    it('should return empty array when sports list is empty', () => {
      dataHolderService.sports.set([]);
      expect(component['disciplineCards']()).toEqual([]);
    });

    it('should build discipline cards from sports and sort by name', () => {
      const mockSports: V2Sport[] = [
        { id: 1, rawName: 'swimming', name: 'Swimming', scoreType: 'TIME', participants: [] },
        { id: 2, rawName: 'athletics', name: 'Athletics', scoreType: 'TIME', participants: [] }
      ];

      dataHolderService.sports.set(mockSports);

      const cards = component['disciplineCards']();
      expect(cards).toHaveLength(2);
      expect(cards[0].displayName).toBe('Athletics');
      expect(cards[1].displayName).toBe('Swimming');
    });

    it('should filter by sport when filterSport is not "all"', () => {
      const mockSports: V2Sport[] = [
        { id: 1, rawName: 'swimming', name: 'Swimming', scoreType: 'TIME', participants: [] },
        { id: 2, rawName: 'athletics', name: 'Athletics', scoreType: 'TIME', participants: [] }
      ];

      dataHolderService.sports.set(mockSports);
      fixture.componentRef.setInput('filterSport', 'swimming');

      const cards = component['disciplineCards']();
      expect(cards).toHaveLength(1);
      expect(cards[0].rawName).toBe('swimming');
    });

    it('should filter by search query matching sport name', () => {
      const mockSports: V2Sport[] = [
        { id: 1, rawName: 'swimming', name: 'Swimming', scoreType: 'TIME', participants: [] },
        { id: 2, rawName: 'athletics', name: 'Athletics', scoreType: 'TIME', participants: [] }
      ];

      dataHolderService.sports.set(mockSports);
      fixture.componentRef.setInput('searchQuery', 'swim');

      const cards = component['disciplineCards']();
      expect(cards).toHaveLength(1);
      expect(cards[0].rawName).toBe('swimming');
    });

    it('should filter by search query matching participant name', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'swimming',
          name: 'Swimming',
          scoreType: 'TIME',
          participants: [
            { athleteId: 1, firstName: 'John', lastName: 'Doe', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 }
          ]
        }
      ];

      dataHolderService.sports.set(mockSports);
      fixture.componentRef.setInput('searchQuery', 'john');

      const cards = component['disciplineCards']();
      expect(cards).toHaveLength(1);
    });

    it('should filter by search query matching country name', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'swimming',
          name: 'Swimming',
          scoreType: 'TIME',
          participants: [
            { athleteId: 1, firstName: 'Jane', lastName: 'Smith', countryId: 1, countryCode: 'US', countryName: 'United States', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 }
          ]
        }
      ];

      dataHolderService.sports.set(mockSports);
      fixture.componentRef.setInput('searchQuery', 'united');

      const cards = component['disciplineCards']();
      expect(cards).toHaveLength(1);
    });

    it('should handle null countryName in participant when searching', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'swimming',
          name: 'Swimming',
          scoreType: 'TIME',
          participants: [
            { athleteId: 1, firstName: 'John', lastName: 'Doe', countryId: null, countryCode: null, countryName: null, medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 }
          ]
        }
      ];

      dataHolderService.sports.set(mockSports);
      fixture.componentRef.setInput('searchQuery', 'john');

      const cards = component['disciplineCards']();
      expect(cards).toHaveLength(1);
    });
  });

  describe('buildDisciplineCard and resolveWinner', () => {
    it('should create card with gold, silver, and bronze winners', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test-sport',
        name: 'Test Sport',
        scoreType: 'PTS',
        participants: [
          { athleteId: 1, firstName: 'Gold', lastName: 'Winner', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '100 pts', rank: 1, resultId: 1 },
          { athleteId: 2, firstName: 'Silver', lastName: 'Winner', countryId: 2, countryCode: 'CN', countryName: 'China', medal: 'SILVER', result: '95 pts', rank: 2, resultId: 2 },
          { athleteId: 3, firstName: 'Bronze', lastName: 'Winner', countryId: 3, countryCode: 'GB', countryName: 'Great Britain', medal: 'BRONZE', result: '90 pts', rank: 3, resultId: 3 }
        ]
      };

      dataHolderService.sports.set([mockSport]);

      const cards = component['disciplineCards']();
      expect(cards[0].gold?.name).toBe('Gold Winner');
      expect(cards[0].gold?.countryCode).toBe('us');
      expect(cards[0].gold?.result).toBe('100');
      expect(cards[0].silver?.name).toBe('Silver Winner');
      expect(cards[0].bronze?.name).toBe('Bronze Winner');
    });

    it('should return null winner when medal slot is empty', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: []
      };

      dataHolderService.sports.set([mockSport]);

      const cards = component['disciplineCards']();
      expect(cards[0].gold).toBeNull();
      expect(cards[0].silver).toBeNull();
      expect(cards[0].bronze).toBeNull();
    });

    it('should filter winner by country', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'US', lastName: 'Athlete', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '10.00', rank: 1, resultId: 1 }
        ]
      };

      dataHolderService.sports.set([mockSport]);
      fixture.componentRef.setInput('filterCountry', 'China');

      const cards = component['disciplineCards']();
      expect(cards[0].gold).toBeNull();
    });

    it('should use countryCode as fallback when countryName is null', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Test', lastName: 'User', countryId: 1, countryCode: 'XX', countryName: null, medal: 'GOLD', result: '10.00', rank: 1, resultId: 1 }
        ]
      };

      dataHolderService.sports.set([mockSport]);

      const cards = component['disciplineCards']();
      expect(cards[0].gold?.countryName).toBe('XX');
    });

    it('should use empty string when both countryName and countryCode are null', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Test', lastName: 'User', countryId: null, countryCode: null, countryName: null, medal: 'GOLD', result: '10.00', rank: 1, resultId: 1 }
        ]
      };

      dataHolderService.sports.set([mockSport]);

      const cards = component['disciplineCards']();
      expect(cards[0].gold?.countryName).toBe('');
      expect(cards[0].gold?.countryCode).toBe('');
    });

    it('should strip pts and wins from result', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'PTS',
        participants: [
          { athleteId: 1, firstName: 'A', lastName: 'A', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '100 pts', rank: 1, resultId: 1 },
          { athleteId: 2, firstName: 'B', lastName: 'B', countryId: 2, countryCode: 'CN', countryName: 'China', medal: 'SILVER', result: '3 wins', rank: 2, resultId: 2 }
        ]
      };

      dataHolderService.sports.set([mockSport]);

      const cards = component['disciplineCards']();
      expect(cards[0].gold?.result).toBe('100');
      expect(cards[0].silver?.result).toBe('3');
    });

    it('should handle null result value', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Test', lastName: 'User', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: null, rank: 1, resultId: 1 }
        ]
      };

      dataHolderService.sports.set([mockSport]);

      const cards = component['disciplineCards']();
      expect(cards[0].gold?.result).toBe('');
    });

    it('should use null scoreType when sport scoreType is null', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: null as any,
        participants: [
          { athleteId: 1, firstName: 'Test', lastName: 'User', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '10', rank: 1, resultId: 1 }
        ]
      };

      dataHolderService.sports.set([mockSport]);

      const cards = component['disciplineCards']();
      expect(cards[0].gold?.scoreType).toBeNull();
    });

    it('should exclude winner when query does not match participant and sport name does not match', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'John', lastName: 'Doe', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 }
        ]
      };

      dataHolderService.sports.set([mockSport]);
      fixture.componentRef.setInput('searchQuery', 'xyz');

      const cards = component['disciplineCards']();
      expect(cards).toHaveLength(0);
    });

    it('should return null winner when both sport name and participant do not match query', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'athletics',
        name: 'Athletics',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Jane', lastName: 'Smith', countryId: 1, countryCode: 'FR', countryName: 'France', medal: 'GOLD', result: '10.00', rank: 1, resultId: 1 }
        ]
      };

      dataHolderService.sports.set([mockSport]);
      fixture.componentRef.setInput('searchQuery', 'xyz nonexistent');

      const cards = component['disciplineCards']();
      const card = cards.find(c => c.rawName === 'athletics');
      expect(card?.gold).toBeUndefined();
    });

    it('should return null when sport name does not match and participant does not match query', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Alice', lastName: 'Wonder', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '50.00', rank: 1, resultId: 1 },
          { athleteId: 2, firstName: 'Bob', lastName: 'Match', countryId: 2, countryCode: 'FR', countryName: 'France', medal: 'SILVER', result: '51.00', rank: 2, resultId: 2 }
        ]
      };

      dataHolderService.sports.set([mockSport]);
      fixture.componentRef.setInput('searchQuery', 'bob');

      const cards = component['disciplineCards']();
      expect(cards).toHaveLength(1);
      expect(cards[0].gold).toBeNull();
      expect(cards[0].silver).not.toBeNull();
    });
  });

  describe('onSubmitDisciplineResult', () => {
    it('should show error when sport is not found', () => {
      jest.spyOn(translateService, 'instant').mockReturnValue('Sport not found');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      dataHolderService.sports.set([]);

      component['onSubmitDisciplineResult']({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'non-existent',
        medal: 'gold',
        resultValue: '100'
      });

      expect(alertSpy).toHaveBeenCalledWith('Sport not found');
    });

    it('should submit result and show success alert', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 10,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: []
      };

      const mockResponse: ResultResponse = {
        id: 100,
        athleteId: 1,
        athleteFirstName: 'John',
        athleteLastName: 'Doe',
        sportId: 10,
        sportRawName: 'swimming',
        medal: 'GOLD',
        timeOrPoints: '47.50',
        scoreType: 'TIME',
        rank: 1
      };

      dataHolderService.sports.set([mockSport]);
      jest.spyOn(resultService, 'upsertResult').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      const patchSpy = jest.spyOn(resultService, 'patchResultUpsert').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Success [name] [sport]');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onSubmitDisciplineResult']({
        athleteId: 1,
        athleteName: 'Test Athlete',
        sportRawName: 'swimming',
        medal: 'gold',
        resultValue: '47.50'
      });

      tick();

      expect(resultService.upsertResult).toHaveBeenCalledWith({
        athleteId: 1,
        sportId: 10,
        medal: 'GOLD',
        timeOrPoints: '47.50',
        scoreType: 'TIME'
      });
      expect(patchSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
    }));

    it('should use athlete name from dataService when athleteName is empty', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 10,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: []
      };

      const mockAthlete: V2Athlete = {
        id: 1,
        firstName: 'Jane',
        lastName: 'Smith',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      const mockResponse: ResultResponse = {
        id: 100,
        athleteId: 1,
        athleteFirstName: 'Jane',
        athleteLastName: 'Smith',
        sportId: 10,
        sportRawName: 'swimming',
        medal: 'GOLD',
        timeOrPoints: '47.50',
        scoreType: 'TIME',
        rank: 1
      };

      dataHolderService.sports.set([mockSport]);
      dataHolderService.athletes.set([mockAthlete]);
      jest.spyOn(resultService, 'upsertResult').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      jest.spyOn(resultService, 'patchResultUpsert').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Success [name] [sport]');
      jest.spyOn(alertService, 'success').mockImplementation();

      component['onSubmitDisciplineResult']({
        athleteId: 1,
        athleteName: '',
        sportRawName: 'swimming',
        medal: 'gold',
        resultValue: '47.50'
      });

      tick();
    }));

    it('should use athleteId as fallback when athleteName is empty and athlete not found', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 10,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: []
      };

      const mockResponse: ResultResponse = {
        id: 100,
        athleteId: 999,
        athleteFirstName: 'Unknown',
        athleteLastName: 'Athlete',
        sportId: 10,
        sportRawName: 'swimming',
        medal: 'GOLD',
        timeOrPoints: '47.50',
        scoreType: 'TIME',
        rank: 1
      };

      dataHolderService.sports.set([mockSport]);
      dataHolderService.athletes.set([]);
      jest.spyOn(resultService, 'upsertResult').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      jest.spyOn(resultService, 'patchResultUpsert').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Success [name] [sport]');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onSubmitDisciplineResult']({
        athleteId: 999,
        athleteName: '',
        sportRawName: 'swimming',
        medal: 'gold',
        resultValue: '47.50'
      });

      tick();

      expect(alertSpy).toHaveBeenCalled();
      const alertCall = alertSpy.mock.calls[0][0];
      expect(alertCall).toContain('#999');
    }));

    it('should handle error on submit', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 10,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: []
      };

      const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

      dataHolderService.sports.set([mockSport]);
      jest.spyOn(resultService, 'upsertResult').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValue('Error message');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component['onSubmitDisciplineResult']({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming',
        medal: 'gold',
        resultValue: '47.50'
      });

      tick();

      expect(consoleSpy).toHaveBeenCalledWith('Error upserting result:', mockError);
      expect(alertSpy).toHaveBeenCalledWith('Error message');

      consoleSpy.mockRestore();
    }));

    it('should handle null scoreType in sport', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 10,
        rawName: 'test',
        name: 'Test',
        scoreType: null as any,
        participants: []
      };

      const mockResponse: ResultResponse = {
        id: 100,
        athleteId: 1,
        athleteFirstName: 'Test',
        athleteLastName: 'User',
        sportId: 10,
        sportRawName: 'test',
        medal: 'GOLD',
        timeOrPoints: '100',
        scoreType: '',
        rank: 1
      };

      dataHolderService.sports.set([mockSport]);
      const upsertSpy = jest.spyOn(resultService, 'upsertResult').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      jest.spyOn(resultService, 'patchResultUpsert').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Success');
      jest.spyOn(alertService, 'success').mockImplementation();

      component['onSubmitDisciplineResult']({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'test',
        medal: 'gold',
        resultValue: '100'
      });

      tick();

      expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({ scoreType: null }));
    }));

    it('should use null when both res.scoreType and sport.scoreType are empty/null', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 10,
        rawName: 'test',
        name: 'Test',
        scoreType: null as any,
        participants: []
      };

      const mockResponse: ResultResponse = {
        id: 100,
        athleteId: 1,
        athleteFirstName: 'Test',
        athleteLastName: 'User',
        sportId: 10,
        sportRawName: 'test',
        medal: 'GOLD',
        timeOrPoints: '100',
        scoreType: '',
        rank: 1
      };

      dataHolderService.sports.set([mockSport]);
      jest.spyOn(resultService, 'upsertResult').mockReturnValue(defer(() => Promise.resolve(mockResponse)));
      const patchSpy = jest.spyOn(resultService, 'patchResultUpsert').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Success');
      jest.spyOn(alertService, 'success').mockImplementation();

      component['onSubmitDisciplineResult']({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'test',
        medal: 'gold',
        resultValue: '100'
      });

      tick();

      expect(patchSpy).toHaveBeenCalledWith(
        'test',
        'GOLD',
        1,
        'Test',
        'User',
        100,
        '100',
        10,
        'Test',
        null
      );
    }));
  });

  describe('onDeleteWinner', () => {
    it('should show error when sport is not found', () => {
      jest.spyOn(translateService, 'instant').mockReturnValue('Error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      dataHolderService.sports.set([]);

      component['onDeleteWinner']('non-existent', 'gold');

      expect(alertSpy).toHaveBeenCalledWith('Error');
    });

    it('should show error when participant is not found', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: []
      };

      jest.spyOn(translateService, 'instant').mockReturnValue('Error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      dataHolderService.sports.set([mockSport]);

      component['onDeleteWinner']('test', 'gold');

      expect(alertSpy).toHaveBeenCalledWith('Error');
    });

    it('should show error when resultId is null', () => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Test', lastName: 'User', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '10.00', rank: 1, resultId: null }
        ]
      };

      jest.spyOn(translateService, 'instant').mockReturnValue('Error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();

      dataHolderService.sports.set([mockSport]);

      component['onDeleteWinner']('test', 'gold');

      expect(alertSpy).toHaveBeenCalledWith('Error');
    });

    it('should delete result and show success alert', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'John', lastName: 'Doe', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 100 }
        ]
      };

      dataHolderService.sports.set([mockSport]);
      jest.spyOn(resultService, 'deleteResult').mockReturnValue(defer(() => Promise.resolve()));
      const patchSpy = jest.spyOn(resultService, 'patchResultDelete').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Deleted [name] [sport]');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onDeleteWinner']('swimming', 'gold');

      tick();

      expect(resultService.deleteResult).toHaveBeenCalledWith(100);
      expect(patchSpy).toHaveBeenCalledWith('swimming', 'GOLD', 1);
      expect(alertSpy).toHaveBeenCalled();
    }));

    it('should use rawName as fallback when sport name is undefined', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'swimming-fallback',
        name: undefined as any,
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'John', lastName: 'Doe', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 100 }
        ]
      };

      dataHolderService.sports.set([mockSport]);
      jest.spyOn(resultService, 'deleteResult').mockReturnValue(defer(() => Promise.resolve()));
      jest.spyOn(resultService, 'patchResultDelete').mockImplementation();
      jest.spyOn(translateService, 'instant').mockReturnValue('Deleted [name] [sport]');
      const alertSpy = jest.spyOn(alertService, 'success').mockImplementation();

      component['onDeleteWinner']('swimming-fallback', 'gold');

      tick();

      const alertCall = alertSpy.mock.calls[0][0];
      expect(alertCall).toContain('swimming-fallback');
    }));

    it('should handle error on delete', fakeAsync(() => {
      const mockSport: V2Sport = {
        id: 1,
        rawName: 'swimming',
        name: 'Swimming',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'John', lastName: 'Doe', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 100 }
        ]
      };

      const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

      dataHolderService.sports.set([mockSport]);
      jest.spyOn(resultService, 'deleteResult').mockReturnValue(defer(() => Promise.reject(mockError)));
      jest.spyOn(translateService, 'instant').mockReturnValue('Error');
      const alertSpy = jest.spyOn(alertService, 'error').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      component['onDeleteWinner']('swimming', 'gold');

      tick();

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting result:', mockError);
      expect(alertSpy).toHaveBeenCalledWith('Error');

      consoleSpy.mockRestore();
    }));
  });

  describe('modal management', () => {
    it('should close discipline modal and reset suspended form', () => {
      component['isDisciplineModalOpen'].set(true);
      component['suspendedDisciplineForm'].set({ athleteId: 1, athleteName: 'Test', sportRawName: 'test', medal: 'gold', resultValue: '100' });

      component['onCloseDisciplineModal']();

      expect(component['isDisciplineModalOpen']()).toBe(false);
      expect(component['suspendedDisciplineForm']()).toBeNull();
    });

    it('should suspend discipline form and open athlete modal', () => {
      const snapshot = { athleteId: 1, athleteName: 'Test', sportRawName: 'test', medal: 'gold' as const, resultValue: '100' };

      component['onOpenAthleteModalFromDiscipline'](snapshot);

      expect(component['suspendedDisciplineForm']()).toEqual(snapshot);
      expect(component['isDisciplineModalOpen']()).toBe(false);
      expect(component['isAthleteModalOpen']()).toBe(true);
    });

    it('should handle athlete created event and reopen discipline modal', fakeAsync(() => {
      const mockAthlete: V2Athlete = {
        id: 10,
        firstName: 'New',
        lastName: 'Athlete',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      component['suspendedDisciplineForm'].set({ athleteId: 0, athleteName: '', sportRawName: 'test', medal: 'gold', resultValue: '100' });

      component['onAthleteCreated'](mockAthlete);

      expect(component['suspendedDisciplineForm']()?.athleteId).toBe(10);
      expect(component['suspendedDisciplineForm']()?.athleteName).toBe('New Athlete');
      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['suspendedAthleteForm']()).toBeNull();

      tick(50);

      expect(component['isDisciplineModalOpen']()).toBe(true);
    }));

    it('should not update suspended form when it is null on athlete created', fakeAsync(() => {
      const mockAthlete: V2Athlete = {
        id: 10,
        firstName: 'New',
        lastName: 'Athlete',
        country: null,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        leaderboardRank: 1,
        results: []
      };

      component['suspendedDisciplineForm'].set(null);

      component['onAthleteCreated'](mockAthlete);

      expect(component['suspendedDisciplineForm']()).toBeNull();
      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['suspendedAthleteForm']()).toBeNull();

      tick(50);

      expect(component['isDisciplineModalOpen']()).toBe(true);
    }));

    it('should close athlete modal and reopen discipline modal when suspended form exists', () => {
      component['suspendedDisciplineForm'].set({ athleteId: 1, athleteName: 'Test', sportRawName: 'test', medal: 'gold', resultValue: '100' });
      component['isAthleteModalOpen'].set(true);

      component['onCloseAthleteModal']();

      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['suspendedAthleteForm']()).toBeNull();
      expect(component['isDisciplineModalOpen']()).toBe(true);
    });

    it('should not reopen discipline modal when suspended form is null', () => {
      component['suspendedDisciplineForm'].set(null);
      component['isAthleteModalOpen'].set(true);

      component['onCloseAthleteModal']();

      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['isDisciplineModalOpen']()).toBe(false);
    });

    it('should suspend athlete form and open country modal', () => {
      const athleteForm = { name: 'Test', countryCode: 'US', countryName: 'USA', sport: 'test', sportRawName: 'test', scoreType: null as any, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' };

      component['onOpenCountryModalFromAthlete'](athleteForm);

      expect(component['suspendedAthleteForm']()).toEqual(athleteForm);
      expect(component['isAthleteModalOpen']()).toBe(false);
      expect(component['isCountryModalOpen']()).toBe(true);
    });

    it('should handle country created and resume athlete modal', fakeAsync(() => {
      const mockCountry: CountryStats = {
        countryId: 10,
        countryCode: 'XX',
        countryName: 'New Country',
        medals: { gold: 0, silver: 0, bronze: 0 },
        nameEn: 'New Country',
        nameDe: 'Neues Land',
        nameFr: 'Nouveau Pays'
      };

      component['suspendedAthleteForm'].set({ name: 'Test', countryCode: '', countryName: '', sport: 'test', sportRawName: 'test', scoreType: null as any, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });

      component['onAddCountryFromDiscipline'](mockCountry);

      expect(component['isCountryModalOpen']()).toBe(false);

      tick(150);

      expect(component['suspendedAthleteForm']()?.countryName).toBe('New Country');
      expect(component['suspendedAthleteForm']()?.countryCode).toBe('XX');
      expect(component['isAthleteModalOpen']()).toBe(true);
    }));

    it('should not resume athlete modal when suspended form is null', fakeAsync(() => {
      const mockCountry: CountryStats = {
        countryId: 10,
        countryCode: 'XX',
        countryName: 'New Country',
        medals: { gold: 0, silver: 0, bronze: 0 }
      };

      component['suspendedAthleteForm'].set(null);

      component['onAddCountryFromDiscipline'](mockCountry);

      expect(component['isCountryModalOpen']()).toBe(false);

      tick(150);

      expect(component['isAthleteModalOpen']()).toBe(false);
    }));

    it('should close country modal and reopen athlete modal when suspended form exists', () => {
      component['suspendedAthleteForm'].set({ name: 'Test', countryCode: 'US', countryName: 'USA', sport: 'test', sportRawName: 'test', scoreType: null as any, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, bestTime: '' });
      component['isCountryModalOpen'].set(true);

      component['onCloseCountryModal']();

      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['isAthleteModalOpen']()).toBe(true);
    });

    it('should not reopen athlete modal when suspended form is null', () => {
      component['suspendedAthleteForm'].set(null);
      component['isCountryModalOpen'].set(true);

      component['onCloseCountryModal']();

      expect(component['isCountryModalOpen']()).toBe(false);
      expect(component['isAthleteModalOpen']()).toBe(false);
    });
  });
});


