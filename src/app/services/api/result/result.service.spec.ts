import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { ResultService } from "./result.service";
import { DataHolderService } from "../../data-holder/data-holder.service";
import { MiscService } from "../../misc/misc.service";
import { API_URL } from "../../../types/API";
import { ResultPayload, ResultResponse, V2Sport } from "../../../types/Disciplines";
import { V2Athlete } from "../../../types/Athlete";

describe('ResultService', () => {
  let service: ResultService;
  let httpMock: HttpTestingController;
  let dataHolderService: DataHolderService;
  let miscService: MiscService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()]
    });
    service = TestBed.inject(ResultService);
    httpMock = TestBed.inject(HttpTestingController);
    dataHolderService = TestBed.inject(DataHolderService);
    miscService = TestBed.inject(MiscService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('upsertResult', () => {
    it('should send POST request with payload', fakeAsync(() => {
      const payload: ResultPayload = {
        athleteId: 1,
        sportId: 10,
        medal: 'GOLD',
        timeOrPoints: '9.58',
        scoreType: 'TIME',
        rank: 1
      };
      const mockResponse: ResultResponse = {
        id: 100,
        athleteId: 1,
        athleteFirstName: 'John',
        athleteLastName: 'Doe',
        sportId: 10,
        sportRawName: '100m-sprint',
        medal: 'GOLD',
        timeOrPoints: '9.58',
        scoreType: 'TIME',
        rank: 1
      };

      let result: ResultResponse | undefined;
      service.upsertResult(payload).subscribe(data => {
        result = data;
      });

      const req = httpMock.expectOne(`${API_URL}/results`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);

      tick();

      expect(result).toEqual(mockResponse);
    }));

    it('should handle error response', fakeAsync(() => {
      const payload: ResultPayload = {
        athleteId: 1,
        sportId: 10,
        medal: 'GOLD',
        timeOrPoints: '9.58',
        scoreType: 'TIME'
      };

      let errorResponse: any;
      service.upsertResult(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/results`);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(400);
    }));
  });

  describe('deleteResult', () => {
    it('should send DELETE request with id', fakeAsync(() => {
      const resultId = 123;

      let completed = false;
      service.deleteResult(resultId).subscribe(() => {
        completed = true;
      });

      const req = httpMock.expectOne(`${API_URL}/results/${resultId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      tick();

      expect(completed).toBe(true);
    }));

    it('should handle error response on delete', fakeAsync(() => {
      const resultId = 456;

      let errorResponse: any;
      service.deleteResult(resultId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne(`${API_URL}/results/${resultId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      tick();

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(404);
    }));
  });

  describe('patchResultUpsert', () => {
    it('should not modify sport when rawName does not match', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'swimming-100m',
          name: 'Swimming 100m',
          scoreType: 'TIME',
          participants: [
            {
              athleteId: 5,
              firstName: 'John',
              lastName: 'Doe',
              medal: 'GOLD',
              result: '50.00',
              rank: null,
              resultId: 50,
              countryId: 1,
              countryCode: 'US',
              countryName: 'USA'
            }
          ]
        },
        {
          id: 2,
          rawName: 'running-100m',
          name: 'Running 100m',
          scoreType: 'TIME',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 10,
          firstName: 'Jane',
          lastName: 'Smith',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('javelin', 'GOLD', 10, 'Jane', 'Smith', 100, '85.00', 3, 'Javelin', 'PTS');

      const updatedSports = dataHolderService.sports();
      expect(updatedSports[0].participants).toHaveLength(1);
      expect(updatedSports[0].participants[0].athleteId).toBe(5);
      expect(updatedSports[1].participants).toHaveLength(0);
    });

    it('should not modify athlete when id does not match in leaderboard data', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'boxing',
          name: 'Boxing',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'Athlete',
          lastName: 'One',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: [
            {
              sportId: 10,
              sportName: 'Other Sport',
              sportRawName: 'other-sport',
              scoreType: 'TIME',
              result: '10.00',
              rank: null,
              medal: 'GOLD'
            }
          ]
        },
        {
          id: 2,
          firstName: 'Athlete',
          lastName: 'Two',
          country: { id: 2, code: 'FR', name: 'France' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('boxing', 'GOLD', 2, 'Athlete', 'Two', 100, '100', 1, 'Boxing', 'PTS');

      const leaderboardData = dataHolderService.leaderboardData();
      const athlete1Results = leaderboardData?.athletes.find(a => a.id === 1)?.results;
      expect(athlete1Results).toHaveLength(1);
      expect(athlete1Results?.[0].sportRawName).toBe('other-sport');
    });

    it('should handle null leaderboardData gracefully', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test-sport',
          name: 'Test Sport',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 10,
          firstName: 'Test',
          lastName: 'User',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set(null);
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchResultUpsert('test-sport', 'GOLD', 10, 'Test', 'User', 100, '100', 1, 'Test Sport', 'PTS');
      }).not.toThrow();

      expect(dataHolderService.leaderboardData()).toBeNull();
    });

    it('should not modify previous athlete when id does not match', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'long-jump',
          name: 'Long Jump',
          scoreType: 'PTS',
          participants: [
            {
              athleteId: 5,
              firstName: 'Previous',
              lastName: 'Holder',
              medal: 'GOLD',
              result: '8.50',
              rank: null,
              resultId: 50,
              countryId: 2,
              countryCode: 'GB',
              countryName: 'Great Britain'
            }
          ]
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 5,
          firstName: 'Previous',
          lastName: 'Holder',
          country: { id: 2, code: 'GB', name: 'Great Britain' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: [
            {
              sportId: 1,
              sportName: 'Long Jump',
              sportRawName: 'long-jump',
              scoreType: 'PTS',
              result: '8.50',
              rank: null,
              medal: 'GOLD'
            }
          ]
        },
        {
          id: 10,
          firstName: 'New',
          lastName: 'Champion',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 2,
          results: []
        },
        {
          id: 20,
          firstName: 'Other',
          lastName: 'Athlete',
          country: { id: 3, code: 'DE', name: 'Germany' },
          medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
          leaderboardRank: 3,
          results: [
            {
              sportId: 2,
              sportName: 'Sprint',
              sportRawName: 'sprint',
              scoreType: 'TIME',
              result: '9.80',
              rank: null,
              medal: 'GOLD'
            }
          ]
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('long-jump', 'GOLD', 10, 'New', 'Champion', 100, '8.95', 1, 'Long Jump', 'PTS');

      const leaderboardData = dataHolderService.leaderboardData();
      const otherAthleteResults = leaderboardData?.athletes.find(a => a.id === 20)?.results;
      expect(otherAthleteResults).toHaveLength(1);
      expect(otherAthleteResults?.[0].sportRawName).toBe('sprint');
    });

    it('should add new participant to sport', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'swimming-100m',
          name: 'Swimming 100m',
          scoreType: 'TIME',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 10,
          firstName: 'Jane',
          lastName: 'Smith',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });

      service.patchResultUpsert('swimming-100m', 'GOLD', 10, 'Jane', 'Smith', 100, '58.23', 1, 'Swimming 100m', 'TIME');

      const updatedSports = dataHolderService.sports();
      expect(updatedSports[0].participants).toHaveLength(1);
      expect(updatedSports[0].participants[0]).toEqual({
        athleteId: 10,
        firstName: 'Jane',
        lastName: 'Smith',
        medal: 'GOLD',
        result: '58.23',
        rank: null,
        resultId: 100,
        countryId: 1,
        countryCode: 'US',
        countryName: 'USA'
      });
    });

    it('should replace existing participant with same medal', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'swimming-100m',
          name: 'Swimming 100m',
          scoreType: 'TIME',
          participants: [
            {
              athleteId: 5,
              firstName: 'Old',
              lastName: 'Winner',
              medal: 'GOLD',
              result: '59.00',
              rank: null,
              resultId: 50,
              countryId: 2,
              countryCode: 'FR',
              countryName: 'France'
            }
          ]
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 5,
          firstName: 'Old',
          lastName: 'Winner',
          country: { id: 2, code: 'FR', name: 'France' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: [
            {
              sportId: 1,
              sportName: 'Swimming 100m',
              sportRawName: 'swimming-100m',
              scoreType: 'TIME',
              result: '59.00',
              rank: null,
              medal: 'GOLD'
            }
          ]
        },
        {
          id: 10,
          firstName: 'New',
          lastName: 'Winner',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('swimming-100m', 'GOLD', 10, 'New', 'Winner', 100, '58.00', 1, 'Swimming 100m', 'TIME');

      const updatedSports = dataHolderService.sports();
      expect(updatedSports[0].participants).toHaveLength(1);
      expect(updatedSports[0].participants[0].athleteId).toBe(10);
      expect(updatedSports[0].participants[0].firstName).toBe('New');
    });

    it('should remove previous holder result from leaderboard data', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'athletics-100m',
          name: 'Athletics 100m',
          scoreType: 'TIME',
          participants: [
            {
              athleteId: 5,
              firstName: 'Previous',
              lastName: 'Holder',
              medal: 'GOLD',
              result: '10.00',
              rank: null,
              resultId: 50,
              countryId: 2,
              countryCode: 'GB',
              countryName: 'Great Britain'
            }
          ]
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 5,
          firstName: 'Previous',
          lastName: 'Holder',
          country: { id: 2, code: 'GB', name: 'Great Britain' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: [
            {
              sportId: 1,
              sportName: 'Athletics 100m',
              sportRawName: 'athletics-100m',
              scoreType: 'TIME',
              result: '10.00',
              rank: null,
              medal: 'GOLD'
            }
          ]
        },
        {
          id: 10,
          firstName: 'New',
          lastName: 'Champion',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('athletics-100m', 'GOLD', 10, 'New', 'Champion', 100, '9.58', 1, 'Athletics 100m', 'TIME');

      const leaderboardData = dataHolderService.leaderboardData();
      const previousHolderResults = leaderboardData?.athletes.find(a => a.id === 5)?.results;
      expect(previousHolderResults).toEqual([]);
    });

    it('should update athlete medals', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'javelin',
          name: 'Javelin Throw',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 10,
          firstName: 'John',
          lastName: 'Thrower',
          country: { id: 1, code: 'DE', name: 'Germany' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('javelin', 'SILVER', 10, 'John', 'Thrower', 200, '85.30', 1, 'Javelin Throw', 'PTS');

      const updatedAthletes = dataHolderService.athletes();
      expect(updatedAthletes[0].medals.silver).toBe(1);
      expect(updatedAthletes[0].medals.gold).toBe(0);
      expect(updatedAthletes[0].medals.bronze).toBe(0);
    });

    it('should add result to leaderboard data', () => {
      const mockSports: V2Sport[] = [
        {
          id: 5,
          rawName: 'marathon',
          name: 'Marathon',
          scoreType: 'TIME',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 20,
          firstName: 'Emma',
          lastName: 'Runner',
          country: { id: 3, code: 'KE', name: 'Kenya' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('marathon', 'BRONZE', 20, 'Emma', 'Runner', 300, '2:20:30', 5, 'Marathon', 'TIME');

      const leaderboardData = dataHolderService.leaderboardData();
      const athleteResults = leaderboardData?.athletes.find(a => a.id === 20)?.results;
      expect(athleteResults).toHaveLength(1);
      expect(athleteResults?.[0]).toEqual({
        sportId: 5,
        sportName: 'Marathon',
        sportRawName: 'marathon',
        scoreType: 'TIME',
        result: '2:20:30',
        rank: null,
        medal: 'BRONZE'
      });
    });

    it('should replace existing result for same sport', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'high-jump',
          name: 'High Jump',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 15,
          firstName: 'Tom',
          lastName: 'Jumper',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 1, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: [
            {
              sportId: 1,
              sportName: 'High Jump',
              sportRawName: 'high-jump',
              scoreType: 'PTS',
              result: '2.30',
              rank: null,
              medal: 'SILVER'
            }
          ]
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('high-jump', 'GOLD', 15, 'Tom', 'Jumper', 400, '2.40', 1, 'High Jump', 'PTS');

      const leaderboardData = dataHolderService.leaderboardData();
      const athleteResults = leaderboardData?.athletes.find(a => a.id === 15)?.results;
      expect(athleteResults).toHaveLength(1);
      expect(athleteResults?.[0].medal).toBe('GOLD');
      expect(athleteResults?.[0].result).toBe('2.40');
    });

    it('should handle athlete with null country', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test-sport',
          name: 'Test Sport',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 99,
          firstName: 'No',
          lastName: 'Country',
          country: null,
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });

      service.patchResultUpsert('test-sport', 'GOLD', 99, 'No', 'Country', 500, '100', 1, 'Test Sport', 'PTS');

      const updatedSports = dataHolderService.sports();
      const participant = updatedSports[0].participants[0];
      expect(participant.countryId).toBeNull();
      expect(participant.countryCode).toBeNull();
      expect(participant.countryName).toBeNull();
    });

    it('should call recalcCountryMedals for affected country', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'sport-x',
          name: 'Sport X',
          scoreType: 'TIME',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'Test',
          lastName: 'Athlete',
          country: { id: 5, code: 'FR', name: 'France' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('sport-x', 'GOLD', 1, 'Test', 'Athlete', 1, '10.00', 1, 'Sport X', 'TIME');

      expect(recalcSpy).toHaveBeenCalledWith(5);
    });

    it('should handle undefined results array when adding result', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test-sport',
          name: 'Test Sport',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 50,
          firstName: 'Test',
          lastName: 'User',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({
        sports: mockSports,
        athletes: mockAthletes.map(a => ({ ...a, results: undefined as any })),
        countries: []
      });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchResultUpsert('test-sport', 'GOLD', 50, 'Test', 'User', 100, '100', 1, 'Test Sport', 'PTS');
      }).not.toThrow();

      const leaderboardData = dataHolderService.leaderboardData();
      const athleteResults = leaderboardData?.athletes.find(a => a.id === 50)?.results;
      expect(athleteResults).toHaveLength(1);
    });

    it('should handle null scoreType when adding result', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'unknown-sport',
          name: 'Unknown Sport',
          scoreType: 'TIME',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 25,
          firstName: 'Unknown',
          lastName: 'Athlete',
          country: { id: 1, code: 'XX', name: 'Unknown' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('unknown-sport', 'GOLD', 25, 'Unknown', 'Athlete', 200, '0', 1, 'Unknown Sport', null);

      const leaderboardData = dataHolderService.leaderboardData();
      const athleteResults = leaderboardData?.athletes.find(a => a.id === 25)?.results;
      expect(athleteResults).toHaveLength(1);
      expect(athleteResults?.[0].scoreType).toBeNull();
    });

    it('should not call recalcCountryMedals when athlete country is null', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test-sport',
          name: 'Test Sport',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 99,
          firstName: 'No',
          lastName: 'Country',
          country: null,
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('test-sport', 'GOLD', 99, 'No', 'Country', 500, '100', 1, 'Test Sport', 'PTS');

      expect(recalcSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined results when removing previous holder result', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'sprint-100m',
          name: 'Sprint 100m',
          scoreType: 'TIME',
          participants: [
            {
              athleteId: 5,
              firstName: 'Previous',
              lastName: 'Holder',
              medal: 'GOLD',
              result: '10.00',
              rank: null,
              resultId: 50,
              countryId: 2,
              countryCode: 'GB',
              countryName: 'Great Britain'
            }
          ]
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 5,
          firstName: 'Previous',
          lastName: 'Holder',
          country: { id: 2, code: 'GB', name: 'Great Britain' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        },
        {
          id: 10,
          firstName: 'New',
          lastName: 'Champion',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({
        sports: mockSports,
        athletes: mockAthletes.map(a => a.id === 5 ? { ...a, results: undefined as any } : a),
        countries: []
      });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchResultUpsert('sprint-100m', 'GOLD', 10, 'New', 'Champion', 100, '9.58', 1, 'Sprint 100m', 'TIME');
      }).not.toThrow();

      const leaderboardData = dataHolderService.leaderboardData();
      const previousHolderResults = leaderboardData?.athletes.find(a => a.id === 5)?.results;
      expect(previousHolderResults).toEqual([]);
    });

    it('should handle null leaderboardData when previous athlete held medal', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'pole-vault',
          name: 'Pole Vault',
          scoreType: 'PTS',
          participants: [
            {
              athleteId: 5,
              firstName: 'Previous',
              lastName: 'Holder',
              medal: 'GOLD',
              result: '6.00',
              rank: null,
              resultId: 50,
              countryId: 2,
              countryCode: 'SE',
              countryName: 'Sweden'
            }
          ]
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 5,
          firstName: 'Previous',
          lastName: 'Holder',
          country: { id: 2, code: 'SE', name: 'Sweden' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        },
        {
          id: 10,
          firstName: 'New',
          lastName: 'Champion',
          country: { id: 1, code: 'FR', name: 'France' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set(null);
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchResultUpsert('pole-vault', 'GOLD', 10, 'New', 'Champion', 100, '6.10', 1, 'Pole Vault', 'PTS');
      }).not.toThrow();

      expect(dataHolderService.leaderboardData()).toBeNull();
    });
  });

  describe('patchResultDelete', () => {
    it('should not modify sport when rawName does not match', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'cycling',
          name: 'Cycling',
          scoreType: 'TIME',
          participants: [
            {
              athleteId: 10,
              firstName: 'Cyclist',
              lastName: 'One',
              medal: 'GOLD',
              result: '1:20:30',
              rank: null,
              resultId: 100,
              countryId: 1,
              countryCode: 'NL',
              countryName: 'Netherlands'
            }
          ]
        },
        {
          id: 2,
          rawName: 'swimming',
          name: 'Swimming',
          scoreType: 'TIME',
          participants: [
            {
              athleteId: 20,
              firstName: 'Swimmer',
              lastName: 'Two',
              medal: 'SILVER',
              result: '58.00',
              rank: null,
              resultId: 101,
              countryId: 2,
              countryCode: 'AU',
              countryName: 'Australia'
            }
          ]
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 10,
          firstName: 'Cyclist',
          lastName: 'One',
          country: { id: 1, code: 'NL', name: 'Netherlands' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('cycling', 'GOLD', 10);

      const updatedSports = dataHolderService.sports();
      expect(updatedSports[1].participants).toHaveLength(1);
      expect(updatedSports[1].participants[0].athleteId).toBe(20);
    });

    it('should not modify athlete when id does not match in leaderboard data', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'tennis',
          name: 'Tennis',
          scoreType: 'WINS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 10,
          firstName: 'Player',
          lastName: 'One',
          country: { id: 1, code: 'ES', name: 'Spain' },
          medals: { gold: 2, silver: 0, bronze: 0, total: 2 },
          leaderboardRank: 1,
          results: [
            {
              sportId: 10,
              sportName: 'Other',
              sportRawName: 'other',
              scoreType: 'PTS',
              result: '100',
              rank: null,
              medal: 'GOLD'
            }
          ]
        },
        {
          id: 20,
          firstName: 'Player',
          lastName: 'Two',
          country: { id: 2, code: 'FR', name: 'France' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 2,
          results: [
            {
              sportId: 1,
              sportName: 'Tennis',
              sportRawName: 'tennis',
              scoreType: 'WINS',
              result: '3',
              rank: null,
              medal: 'GOLD'
            }
          ]
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('tennis', 'GOLD', 20);

      const leaderboardData = dataHolderService.leaderboardData();
      const player1Results = leaderboardData?.athletes.find(a => a.id === 10)?.results;
      expect(player1Results).toHaveLength(1);
      expect(player1Results?.[0].sportRawName).toBe('other');
    });

    it('should handle null leaderboardData gracefully', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test-sport',
          name: 'Test Sport',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 10,
          firstName: 'Test',
          lastName: 'User',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set(null);
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchResultDelete('test-sport', 'GOLD', 10);
      }).not.toThrow();

      expect(dataHolderService.leaderboardData()).toBeNull();
    });

    it('should remove participant from sport', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'cycling',
          name: 'Cycling',
          scoreType: 'TIME',
          participants: [
            {
              athleteId: 10,
              firstName: 'Cyclist',
              lastName: 'One',
              medal: 'GOLD',
              result: '1:20:30',
              rank: null,
              resultId: 100,
              countryId: 1,
              countryCode: 'NL',
              countryName: 'Netherlands'
            },
            {
              athleteId: 11,
              firstName: 'Cyclist',
              lastName: 'Two',
              medal: 'SILVER',
              result: '1:21:00',
              rank: null,
              resultId: 101,
              countryId: 2,
              countryCode: 'BE',
              countryName: 'Belgium'
            }
          ]
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 10,
          firstName: 'Cyclist',
          lastName: 'One',
          country: { id: 1, code: 'NL', name: 'Netherlands' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('cycling', 'GOLD', 10);

      const updatedSports = dataHolderService.sports();
      expect(updatedSports[0].participants).toHaveLength(1);
      expect(updatedSports[0].participants[0].athleteId).toBe(11);
    });

    it('should remove result from leaderboard data', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'tennis',
          name: 'Tennis',
          scoreType: 'WINS',
          participants: [
            {
              athleteId: 20,
              firstName: 'Tennis',
              lastName: 'Player',
              medal: 'GOLD',
              result: '3',
              rank: null,
              resultId: 200,
              countryId: 1,
              countryCode: 'ES',
              countryName: 'Spain'
            }
          ]
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 20,
          firstName: 'Tennis',
          lastName: 'Player',
          country: { id: 1, code: 'ES', name: 'Spain' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: [
            {
              sportId: 1,
              sportName: 'Tennis',
              sportRawName: 'tennis',
              scoreType: 'WINS',
              result: '3',
              rank: null,
              medal: 'GOLD'
            }
          ]
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('tennis', 'GOLD', 20);

      const leaderboardData = dataHolderService.leaderboardData();
      const athleteResults = leaderboardData?.athletes.find(a => a.id === 20)?.results;
      expect(athleteResults).toEqual([]);
    });

    it('should decrement athlete gold medals', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'boxing',
          name: 'Boxing',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 30,
          firstName: 'Boxer',
          lastName: 'Joe',
          country: { id: 1, code: 'CU', name: 'Cuba' },
          medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('boxing', 'GOLD', 30);

      const updatedAthletes = dataHolderService.athletes();
      expect(updatedAthletes[0].medals.gold).toBe(1);
      expect(updatedAthletes[0].medals.silver).toBe(1);
      expect(updatedAthletes[0].medals.bronze).toBe(0);
    });

    it('should decrement athlete silver medals', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'fencing',
          name: 'Fencing',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 40,
          firstName: 'Fencer',
          lastName: 'Smith',
          country: { id: 1, code: 'IT', name: 'Italy' },
          medals: { gold: 0, silver: 3, bronze: 1, total: 4 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('fencing', 'SILVER', 40);

      const updatedAthletes = dataHolderService.athletes();
      expect(updatedAthletes[0].medals.silver).toBe(2);
    });

    it('should decrement athlete bronze medals', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'rowing',
          name: 'Rowing',
          scoreType: 'TIME',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 50,
          firstName: 'Rower',
          lastName: 'Anna',
          country: { id: 1, code: 'RO', name: 'Romania' },
          medals: { gold: 1, silver: 1, bronze: 2, total: 4 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('rowing', 'BRONZE', 50);

      const updatedAthletes = dataHolderService.athletes();
      expect(updatedAthletes[0].medals.bronze).toBe(1);
    });

    it('should not decrement medals below zero', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'archery',
          name: 'Archery',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 60,
          firstName: 'Archer',
          lastName: 'Rob',
          country: { id: 1, code: 'KR', name: 'South Korea' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('archery', 'GOLD', 60);

      const updatedAthletes = dataHolderService.athletes();
      expect(updatedAthletes[0].medals.gold).toBe(0);
    });

    it('should update total medal count in leaderboard data', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'weightlifting',
          name: 'Weightlifting',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 70,
          firstName: 'Lifter',
          lastName: 'Strong',
          country: { id: 1, code: 'BG', name: 'Bulgaria' },
          medals: { gold: 2, silver: 1, bronze: 1, total: 4 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('weightlifting', 'GOLD', 70);

      const leaderboardData = dataHolderService.leaderboardData();
      const athleteMedals = leaderboardData?.athletes.find(a => a.id === 70)?.medals;
      expect(athleteMedals?.total).toBe(3);
      expect(athleteMedals?.gold).toBe(1);
    });

    it('should call recalcCountryMedals after deletion', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'gymnastics',
          name: 'Gymnastics',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 80,
          firstName: 'Gymnast',
          lastName: 'Flex',
          country: { id: 7, code: 'RU', name: 'Russia' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('gymnastics', 'GOLD', 80);

      expect(recalcSpy).toHaveBeenCalledWith(7);
    });

    it('should not call recalcCountryMedals if country is null', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test',
          name: 'Test',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 90,
          firstName: 'No',
          lastName: 'Country',
          country: null,
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      const recalcSpy = jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultDelete('test', 'GOLD', 90);

      expect(recalcSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined results array in leaderboard data', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'sport-y',
          name: 'Sport Y',
          scoreType: 'TIME',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 100,
          firstName: 'Test',
          lastName: 'Case',
          country: { id: 1, code: 'XX', name: 'Test' },
          medals: { gold: 1, silver: 0, bronze: 0, total: 1 },
          leaderboardRank: 1,
          results: undefined as any
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchResultDelete('sport-y', 'GOLD', 100);
      }).not.toThrow();

      const leaderboardData = dataHolderService.leaderboardData();
      const athleteResults = leaderboardData?.athletes.find(a => a.id === 100)?.results;
      expect(athleteResults).toEqual([]);
    });
  });

  describe('_patchAthleteMedals (via patchResultUpsert/Delete)', () => {
    it('should not modify athlete medals when id does not match in athletes list', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test',
          name: 'Test',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'Athlete',
          lastName: 'One',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 5, silver: 3, bronze: 2, total: 10 },
          leaderboardRank: 1,
          results: []
        },
        {
          id: 2,
          firstName: 'Athlete',
          lastName: 'Two',
          country: { id: 2, code: 'FR', name: 'France' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('test', 'GOLD', 2, 'Athlete', 'Two', 100, '100', 1, 'Test', 'PTS');

      const updatedAthletes = dataHolderService.athletes();
      const athlete1 = updatedAthletes.find(a => a.id === 1);
      expect(athlete1?.medals.gold).toBe(5);
      expect(athlete1?.medals.silver).toBe(3);
      expect(athlete1?.medals.bronze).toBe(2);
    });

    it('should not modify athlete medals in leaderboard when id does not match', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test',
          name: 'Test',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'Athlete',
          lastName: 'One',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 3, silver: 2, bronze: 1, total: 6 },
          leaderboardRank: 1,
          results: []
        },
        {
          id: 2,
          firstName: 'Athlete',
          lastName: 'Two',
          country: { id: 2, code: 'DE', name: 'Germany' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 2,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set({ sports: mockSports, athletes: mockAthletes, countries: [] });
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      service.patchResultUpsert('test', 'SILVER', 2, 'Athlete', 'Two', 200, '50', 1, 'Test', 'PTS');

      const leaderboardData = dataHolderService.leaderboardData();
      const athlete1 = leaderboardData?.athletes.find(a => a.id === 1);
      expect(athlete1?.medals.gold).toBe(3);
      expect(athlete1?.medals.silver).toBe(2);
      expect(athlete1?.medals.bronze).toBe(1);
      expect(athlete1?.medals.total).toBe(6);
    });

    it('should handle null leaderboardData in _patchAthleteMedals', () => {
      const mockSports: V2Sport[] = [
        {
          id: 1,
          rawName: 'test',
          name: 'Test',
          scoreType: 'PTS',
          participants: []
        }
      ];
      const mockAthletes: V2Athlete[] = [
        {
          id: 1,
          firstName: 'Test',
          lastName: 'User',
          country: { id: 1, code: 'US', name: 'USA' },
          medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
          leaderboardRank: 1,
          results: []
        }
      ];

      dataHolderService.sports.set(mockSports);
      dataHolderService.athletes.set(mockAthletes);
      dataHolderService.leaderboardData.set(null);
      jest.spyOn(miscService, 'recalcCountryMedals').mockImplementation();

      expect(() => {
        service.patchResultUpsert('test', 'GOLD', 1, 'Test', 'User', 100, '100', 1, 'Test', 'PTS');
      }).not.toThrow();

      const updatedAthletes = dataHolderService.athletes();
      expect(updatedAthletes[0].medals.gold).toBe(1);
    });
  });
});
