import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ModalDisciplineComponent } from './modal-discipline.component';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { V2Athlete } from "../../../../types/Athlete";
import { V2Sport } from "../../../../types/Disciplines";

describe('ModalDisciplineComponent', () => {
  let component: ModalDisciplineComponent;
  let fixture: ComponentFixture<ModalDisciplineComponent>;
  let translateService: TranslateService;

  const mockAthletes: V2Athlete[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      country: null,
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
      leaderboardRank: 1,
      results: []
    },
    {
      id: 2,
      firstName: 'Alice',
      lastName: 'Smith',
      country: null,
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
      leaderboardRank: 2,
      results: []
    }
  ];

  const mockSports: V2Sport[] = [
    {
      id: 1,
      rawName: 'swimming-100m',
      name: 'Swimming 100m',
      scoreType: 'TIME',
      participants: []
    },
    {
      id: 2,
      rawName: 'javelin',
      name: 'Javelin',
      scoreType: 'PTS',
      participants: []
    },
    {
      id: 3,
      rawName: 'wrestling',
      name: 'Wrestling',
      scoreType: 'WINS',
      participants: []
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDisciplineComponent, HttpClientTestingModule, TranslateModule.forRoot()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ModalDisciplineComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);

    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('athletes', mockAthletes);
    fixture.componentRef.setInput('sports', mockSports);
    fixture.componentRef.setInput('countries', ['USA', 'France']);
    fixture.componentRef.setInput('resumeData', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('signals initialization', () => {
    it('should initialize with empty form and no errors', () => {
      expect(component['formData']()).toEqual({
        athleteId: 0,
        athleteName: '',
        sportRawName: '',
        medal: 'gold',
        resultValue: ''
      });
      expect(component['resultError']()).toBe('');
      expect(component['isClosing']()).toBe(false);
    });
  });

  describe('sortedAthletes computed signal', () => {
    it('should sort athletes alphabetically by full name', () => {
      const sorted = component['sortedAthletes']();

      expect(sorted).toHaveLength(2);
      expect(sorted[0].firstName).toBe('Alice');
      expect(sorted[1].firstName).toBe('John');
    });

    it('should handle empty athletes array', () => {
      fixture.componentRef.setInput('athletes', []);

      const sorted = component['sortedAthletes']();

      expect(sorted).toEqual([]);
    });
  });

  describe('effect - resumeData', () => {
    it('should restore form data when resumeData is provided', fakeAsync(() => {
      const resumeData = {
        athleteId: 1,
        athleteName: 'John Doe',
        sportRawName: 'swimming-100m',
        medal: 'gold' as const,
        resultValue: '47.50'
      };

      component['formData'].set({
        athleteId: 0,
        athleteName: '',
        sportRawName: '',
        medal: 'silver' as const,
        resultValue: ''
      });
      component['resultError'].set('Some error');

      fixture.componentRef.setInput('resumeData', resumeData);
      fixture.detectChanges();
      tick();

      expect(component['formData']()).toEqual(resumeData);
      expect(component['resultError']()).toBe('');
    }));

    it('should not update form when resumeData is null', fakeAsync(() => {
      const originalForm = component['formData']();

      fixture.componentRef.setInput('resumeData', null);
      fixture.detectChanges();
      tick();

      expect(component['formData']()).toEqual(originalForm);
    }));
  });

  describe('selectedScoreType computed signal', () => {
    it('should return null when no sport is selected', () => {
      expect(component['selectedScoreType']()).toBeNull();
    });

    it('should return TIME for swimming', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'swimming-100m' }));

      expect(component['selectedScoreType']()).toBe('TIME');
    });

    it('should return PTS for javelin', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'javelin' }));

      expect(component['selectedScoreType']()).toBe('PTS');
    });

    it('should return WINS for wrestling', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'wrestling' }));

      expect(component['selectedScoreType']()).toBe('WINS');
    });

    it('should return null when sport is not found', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'non-existent' }));

      expect(component['selectedScoreType']()).toBeNull();
    });

    it('should use nullish coalescing when scoreType is undefined', () => {
      const sportWithoutType: V2Sport = {
        id: 4,
        rawName: 'test-sport',
        name: 'Test',
        scoreType: null as any,
        participants: []
      };

      fixture.componentRef.setInput('sports', [...mockSports, sportWithoutType]);
      component['formData'].update(f => ({ ...f, sportRawName: 'test-sport' }));

      expect(component['selectedScoreType']()).toBeNull();
    });
  });

  describe('resultLabelKey computed signal', () => {
    it('should return POINTS key for PTS scoreType', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'javelin' }));

      expect(component['resultLabelKey']()).toBe('MODAL.ATHLETE.POINTS');
    });

    it('should return WINS key for WINS scoreType', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'wrestling' }));

      expect(component['resultLabelKey']()).toBe('MODAL.ATHLETE.WINS');
    });

    it('should return BESTTIME key for TIME scoreType', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'swimming-100m' }));

      expect(component['resultLabelKey']()).toBe('MODAL.ATHLETE.BESTTIME');
    });

    it('should return BESTTIME key for null scoreType', () => {
      expect(component['resultLabelKey']()).toBe('MODAL.ATHLETE.BESTTIME');
    });
  });

  describe('resultPlaceholder computed signal', () => {
    it('should return points placeholder for PTS', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'javelin' }));

      expect(component['resultPlaceholder']()).toBe('335.30');
    });

    it('should return wins placeholder for WINS', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'wrestling' }));

      expect(component['resultPlaceholder']()).toBe('3');
    });

    it('should return time placeholder for TIME', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'swimming-100m' }));

      expect(component['resultPlaceholder']()).toBe('3:24.56');
    });

    it('should return time placeholder for null scoreType', () => {
      expect(component['resultPlaceholder']()).toBe('3:24.56');
    });
  });

  describe('onSportChange', () => {
    it('should update sportRawName and reset resultValue and error', () => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'old-sport',
        medal: 'gold',
        resultValue: '100'
      });
      component['resultError'].set('Some error');

      component['onSportChange']('swimming-100m');

      expect(component['formData']().sportRawName).toBe('swimming-100m');
      expect(component['formData']().resultValue).toBe('');
      expect(component['resultError']()).toBe('');
    });
  });

  describe('onResultChange - TIME validation', () => {
    beforeEach(() => {
      component['formData'].update(f => ({ ...f, sportRawName: 'swimming-100m' }));
      jest.spyOn(translateService, 'instant').mockReturnValue('Invalid time format');
    });

    it('should accept valid time formats', () => {
      const validTimes = ['47.50', '1:23.45', '1:23:45', '1:23:45.123'];

      validTimes.forEach(time => {
        component['onResultChange'](time);
        expect(component['resultError']()).toBe('');
        expect(component['formData']().resultValue).toBe(time);
      });
    });

    it('should reject invalid time formats', () => {
      component['onResultChange']('abc');

      expect(component['resultError']()).toBe('Invalid time format');
    });

    it('should clear error when value is empty', () => {
      component['resultError'].set('Some error');

      component['onResultChange']('   ');

      expect(component['resultError']()).toBe('');
    });
  });

  describe('onResultChange - PTS validation', () => {
    beforeEach(() => {
      component['formData'].update(f => ({ ...f, sportRawName: 'javelin' }));
      jest.spyOn(translateService, 'instant').mockReturnValue('Invalid points format');
    });

    it('should accept valid points formats', () => {
      const validPoints = ['100', '335.30', '99.9'];

      validPoints.forEach(pts => {
        component['onResultChange'](pts);
        expect(component['resultError']()).toBe('');
      });
    });

    it('should reject invalid points formats', () => {
      component['onResultChange']('100.123');

      expect(component['resultError']()).toBe('Invalid points format');
    });
  });

  describe('onResultChange - WINS validation', () => {
    beforeEach(() => {
      component['formData'].update(f => ({ ...f, sportRawName: 'wrestling' }));
      jest.spyOn(translateService, 'instant').mockReturnValue('Invalid wins format');
    });

    it('should accept valid integer wins', () => {
      component['onResultChange']('5');

      expect(component['resultError']()).toBe('');
    });

    it('should reject decimal wins', () => {
      component['onResultChange']('5.5');

      expect(component['resultError']()).toBe('Invalid wins format');
    });
  });

  describe('onResultChange - null scoreType', () => {
    it('should clear error when scoreType is null', () => {
      component['resultError'].set('Some error');

      component['onResultChange']('anything');

      expect(component['resultError']()).toBe('');
    });
  });

  describe('rankingError - TIME scoreType', () => {
    const timeSport: V2Sport = {
      id: 1,
      rawName: 'swimming',
      name: 'Swimming',
      scoreType: 'TIME',
      participants: [
        { athleteId: 1, firstName: 'Gold', lastName: 'Winner', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 },
        { athleteId: 2, firstName: 'Bronze', lastName: 'Winner', countryId: 2, countryCode: 'FR', countryName: 'France', medal: 'BRONZE', result: '49.00', rank: 3, resultId: 2 }
      ]
    };

    beforeEach(() => {
      fixture.componentRef.setInput('sports', [timeSport]);
      jest.spyOn(translateService, 'instant').mockReturnValue('MODAL.DISCIPLINE.ERROR.RANKING');
    });

    it('should return empty when form is incomplete', () => {
      expect(component['rankingError']()).toBe('');
    });

    it('should return empty when sport is not found in rankingError', () => {
      const testSport: V2Sport = {
        id: 99,
        rawName: 'test-sport',
        name: 'Test Sport',
        scoreType: 'TIME',
        participants: []
      };

      let callCount = 0;
      jest.spyOn(component as any, 'sports').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return [testSport];
        } else {
          return [];
        }
      });

      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'test-sport',
        medal: 'silver',
        resultValue: '48.00'
      });


      expect(component['rankingError']()).toBe('');
    });

    it('should return empty when selectedScoreType is null', () => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'non-existent-sport',
        medal: 'gold',
        resultValue: '100'
      });


      expect(component['rankingError']()).toBe('');
    });

    it('should return error when silver time is slower than bronze', () => {
      component['formData'].set({
        athleteId: 3,
        athleteName: 'Test',
        sportRawName: 'swimming',
        medal: 'silver',
        resultValue: '50.00'
      });

      expect(component['rankingError']()).toBe('MODAL.DISCIPLINE.ERROR.RANKING');
    });

    it('should return error when silver time is faster than gold', () => {
      component['formData'].set({
        athleteId: 3,
        athleteName: 'Test',
        sportRawName: 'swimming',
        medal: 'silver',
        resultValue: '46.00'
      });

      expect(component['rankingError']()).toBe('MODAL.DISCIPLINE.ERROR.RANKING');
    });

    it('should return empty when silver time is between gold and bronze', () => {
      component['formData'].set({
        athleteId: 3,
        athleteName: 'Test',
        sportRawName: 'swimming',
        medal: 'silver',
        resultValue: '48.00'
      });

      expect(component['rankingError']()).toBe('');
    });

    it('should skip same medal comparison', () => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming',
        medal: 'gold',
        resultValue: '47.50'
      });

      expect(component['rankingError']()).toBe('');
    });
  });

  describe('rankingError - PTS scoreType', () => {
    const ptsSport: V2Sport = {
      id: 2,
      rawName: 'javelin',
      name: 'Javelin',
      scoreType: 'PTS',
      participants: [
        { athleteId: 1, firstName: 'Gold', lastName: 'Winner', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '90.50 pts', rank: 1, resultId: 1 },
        { athleteId: 2, firstName: 'Bronze', lastName: 'Winner', countryId: 2, countryCode: 'FR', countryName: 'France', medal: 'BRONZE', result: '85.00 pts', rank: 3, resultId: 2 }
      ]
    };

    beforeEach(() => {
      fixture.componentRef.setInput('sports', [ptsSport]);
      jest.spyOn(translateService, 'instant').mockReturnValue('MODAL.DISCIPLINE.ERROR.RANKING');
    });

    it('should return error when silver score is lower than bronze', () => {
      component['formData'].set({
        athleteId: 3,
        athleteName: 'Test',
        sportRawName: 'javelin',
        medal: 'silver',
        resultValue: '84.00'
      });

      expect(component['rankingError']()).toBe('MODAL.DISCIPLINE.ERROR.RANKING');
    });

    it('should return error when silver score is higher than gold', () => {
      component['formData'].set({
        athleteId: 3,
        athleteName: 'Test',
        sportRawName: 'javelin',
        medal: 'silver',
        resultValue: '91.00'
      });

      expect(component['rankingError']()).toBe('MODAL.DISCIPLINE.ERROR.RANKING');
    });

    it('should return empty when silver score is between gold and bronze', () => {
      component['formData'].set({
        athleteId: 3,
        athleteName: 'Test',
        sportRawName: 'javelin',
        medal: 'silver',
        resultValue: '88.00'
      });

      expect(component['rankingError']()).toBe('');
    });
  });

  describe('rankingError - WINS scoreType', () => {
    const winsSport: V2Sport = {
      id: 3,
      rawName: 'wrestling',
      name: 'Wrestling',
      scoreType: 'WINS',
      participants: [
        { athleteId: 1, firstName: 'Gold', lastName: 'Winner', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '5 wins', rank: 1, resultId: 1 }
      ]
    };

    beforeEach(() => {
      fixture.componentRef.setInput('sports', [winsSport]);
      jest.spyOn(translateService, 'instant').mockReturnValue('MODAL.DISCIPLINE.ERROR.RANKING');
    });

    it('should return error when silver has more wins than gold', () => {
      component['formData'].set({
        athleteId: 2,
        athleteName: 'Test',
        sportRawName: 'wrestling',
        medal: 'silver',
        resultValue: '6'
      });

      expect(component['rankingError']()).toBe('MODAL.DISCIPLINE.ERROR.RANKING');
    });

    it('should return empty when silver has fewer wins than gold', () => {
      component['formData'].set({
        athleteId: 2,
        athleteName: 'Test',
        sportRawName: 'wrestling',
        medal: 'silver',
        resultValue: '4'
      });

      expect(component['rankingError']()).toBe('');
    });
  });

  describe('rankingError - edge cases', () => {
    it('should return empty when result is unparseable', () => {
      const sport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: []
      };

      fixture.componentRef.setInput('sports', [sport]);

      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'test',
        medal: 'gold',
        resultValue: 'invalid'
      });

      expect(component['rankingError']()).toBe('');
    });

    it('should skip participants without medal or result', () => {
      const sport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'No', lastName: 'Medal', countryId: 1, countryCode: 'US', countryName: 'USA', medal: null, result: '47.00', rank: 5, resultId: 1 },
          { athleteId: 2, firstName: 'No', lastName: 'Result', countryId: 2, countryCode: 'FR', countryName: 'France', medal: 'GOLD', result: null, rank: 1, resultId: 2 }
        ]
      };

      fixture.componentRef.setInput('sports', [sport]);

      component['formData'].set({
        athleteId: 3,
        athleteName: 'Test',
        sportRawName: 'test',
        medal: 'silver',
        resultValue: '48.00'
      });

      expect(component['rankingError']()).toBe('');
    });

    it('should skip participants with unparseable results', () => {
      const sport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'PTS',
        participants: [
          { athleteId: 1, firstName: 'Bad', lastName: 'Result', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: 'invalid', rank: 1, resultId: 1 }
        ]
      };

      fixture.componentRef.setInput('sports', [sport]);

      component['formData'].set({
        athleteId: 2,
        athleteName: 'Test',
        sportRawName: 'test',
        medal: 'silver',
        resultValue: '80.00'
      });

      expect(component['rankingError']()).toBe('');
    });
  });

  describe('parseScore - TIME formats', () => {
    it('should parse seconds only', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'swimming-100m', resultValue: '47.50' }));
      expect(component['rankingError']()).toBe('');
    });

    it('should parse mm:ss format', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'swimming-100m', resultValue: '1:30' }));
      expect(component['rankingError']()).toBe('');
    });

    it('should parse h:mm:ss format', () => {
      component['formData'].update(f => ({ ...f, sportRawName: 'swimming-100m', resultValue: '2:15:30' }));
      expect(component['rankingError']()).toBe('');
    });

    it('should return empty ranking error when formattedValue is empty after trimming', () => {
      const sport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Gold', lastName: 'Winner', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 }
        ]
      };

      fixture.componentRef.setInput('sports', [sport]);

      component['formData'].set({
        athleteId: 2,
        athleteName: 'Test',
        sportRawName: 'test',
        medal: 'silver',
        resultValue: '   pts   '
      });

      expect(component['rankingError']()).toBe('');
    });

    it('should return empty ranking error when TIME format has too many colons', () => {
      const sport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Gold', lastName: 'Winner', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 }
        ]
      };

      fixture.componentRef.setInput('sports', [sport]);

      component['formData'].set({
        athleteId: 2,
        athleteName: 'Test',
        sportRawName: 'test',
        medal: 'silver',
        resultValue: '1:2:3:4'
      });

      expect(component['rankingError']()).toBe('');
    });
  });

  describe('onAthleteChange', () => {
    it('should update athleteId and athleteName when athlete is found', () => {
      component['onAthleteChange'](1);

      expect(component['formData']().athleteId).toBe(1);
      expect(component['formData']().athleteName).toBe('John Doe');
    });

    it('should clear athleteName when athlete is not found', () => {
      component['onAthleteChange'](999);

      expect(component['formData']().athleteId).toBe(999);
      expect(component['formData']().athleteName).toBe('');
    });
  });

  describe('isFormValid computed signal', () => {
    it('should return false when athleteId is 0', () => {
      component['formData'].set({
        athleteId: 0,
        athleteName: '',
        sportRawName: 'swimming-100m',
        medal: 'gold',
        resultValue: '47.50'
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return false when sportRawName is empty', () => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: '',
        medal: 'gold',
        resultValue: '47.50'
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return false when medal is empty', () => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming-100m',
        medal: '' as any,
        resultValue: '47.50'
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return false when resultValue is empty or whitespace', () => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming-100m',
        medal: 'gold',
        resultValue: '   '
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return false when resultError is not empty', () => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming-100m',
        medal: 'gold',
        resultValue: 'invalid'
      });
      component['resultError'].set('Error');

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return false when rankingError is not empty', () => {
      const sport: V2Sport = {
        id: 1,
        rawName: 'test',
        name: 'Test',
        scoreType: 'TIME',
        participants: [
          { athleteId: 1, firstName: 'Gold', lastName: 'Winner', countryId: 1, countryCode: 'US', countryName: 'USA', medal: 'GOLD', result: '47.00', rank: 1, resultId: 1 }
        ]
      };

      fixture.componentRef.setInput('sports', [sport]);
      jest.spyOn(translateService, 'instant').mockReturnValue('Ranking error');

      component['formData'].set({
        athleteId: 2,
        athleteName: 'Test',
        sportRawName: 'test',
        medal: 'silver',
        resultValue: '46.00'
      });

      expect(component['isFormValid']()).toBe(false);
    });

    it('should return true when all conditions are met', () => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming-100m',
        medal: 'gold',
        resultValue: '47.50'
      });

      expect(component['isFormValid']()).toBe(true);
    });
  });

  describe('onOpenAthleteModal', () => {
    it('should emit form snapshot', () => {
      const formData = {
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming-100m',
        medal: 'gold' as const,
        resultValue: '47.50'
      };

      component['formData'].set(formData);

      const emitSpy = jest.spyOn(component.openAthleteModal, 'emit');

      component['onOpenAthleteModal']();

      expect(emitSpy).toHaveBeenCalledWith(formData);
    });
  });

  describe('close', () => {
    it('should set isClosing, reset form and emit closeModal after 200ms', fakeAsync(() => {
      component['formData'].set({
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming-100m',
        medal: 'gold',
        resultValue: '47.50'
      });
      component['resultError'].set('Some error');

      const closeModalSpy = jest.spyOn(component.closeModal, 'emit');

      component['close']();

      expect(component['isClosing']()).toBe(true);

      tick(199);
      expect(component['formData']().athleteId).toBe(1);
      expect(closeModalSpy).not.toHaveBeenCalled();

      tick(1);

      expect(component['isClosing']()).toBe(false);
      expect(component['formData']()).toEqual({
        athleteId: 0,
        athleteName: '',
        sportRawName: '',
        medal: 'gold',
        resultValue: ''
      });
      expect(component['resultError']()).toBe('');
      expect(closeModalSpy).toHaveBeenCalled();
    }));
  });

  describe('onSubmit', () => {
    it('should not emit when form is invalid', () => {
      component['formData'].set({
        athleteId: 0,
        athleteName: '',
        sportRawName: '',
        medal: 'gold',
        resultValue: ''
      });

      const submitSpy = jest.spyOn(component.submitResult, 'emit');
      const closeSpy = jest.spyOn(component as any, 'close');

      component['onSubmit']();

      expect(submitSpy).not.toHaveBeenCalled();
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should emit submitResult and close when form is valid', fakeAsync(() => {
      const formData = {
        athleteId: 1,
        athleteName: 'Test',
        sportRawName: 'swimming-100m',
        medal: 'gold' as const,
        resultValue: '47.50'
      };

      component['formData'].set(formData);

      const submitSpy = jest.spyOn(component.submitResult, 'emit');
      const closeModalSpy = jest.spyOn(component.closeModal, 'emit');

      component['onSubmit']();

      expect(submitSpy).toHaveBeenCalledWith(formData);
      expect(component['isClosing']()).toBe(true);

      tick(200);

      expect(closeModalSpy).toHaveBeenCalled();
    }));
  });
});

