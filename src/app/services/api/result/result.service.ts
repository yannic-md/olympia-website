import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';
import { DataHolderService } from '../../data-holder/data-holder.service';
import { MiscService } from '../../misc/misc.service';
import {DisciplineParticipant, ResultPayload, ResultResponse, V2Sport, V2SportResult} from '../../../types/Disciplines';
import { Athlete } from '../../../types/Athlete';

@Injectable({ providedIn: 'root' })
export class ResultService {

  constructor(private http: HttpClient, private dataService: DataHolderService, private miscService: MiscService) {}

  /**
   * Creates or updates a sport result (upsert by sport+athlete combination).
   *
   * @param {ResultPayload} payload - The result data to persist.
   * @returns {Observable<ResultResponse>} Observable with the persisted result.
   */
  upsertResult(payload: ResultPayload): Observable<ResultResponse> {
    return this.http.post<ResultResponse>(`${API_URL}/results`, payload);
  }

  /**
   * Deletes a result by its ID.
   *
   * @param {number} id - The result row ID to delete.
   * @returns {Observable<void>} Observable that completes on success.
   */
  deleteResult(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/results/${id}`);
  }

  // *----------------------------------------------*
  //            HELPER - METHODS
  // *----------------------------------------------*

  /**
   * Patches all local reactive stores after a result upsert.
   *
   * Finds the sport by rawName and updates or inserts the participant entry.
   * Also updates the athlete's local medal count, the leaderboard results list and recalculates country medals.
   *
   * @param {string} sportRawName - The rawName of the affected sport.
   * @param {'GOLD'|'SILVER'|'BRONZE'} medal - The medal that was awarded.
   * @param {number} athleteId - The ID of the athlete.
   * @param {string} athleteFirstName - First name of the athlete.
   * @param {string} athleteLastName - Last name of the athlete.
   * @param {number} resultId - The result row ID returned by the API.
   * @param {string} timeOrPoints - The stored result value.
   * @param {number} sportId - The numeric sport ID returned by the API.
   * @param {string} sportDisplayName - The translated display name of the sport.
   * @param {string | null} scoreType - The score type string (TIME/PTS/WINS) or null.
   */
  patchResultUpsert(sportRawName: string, medal: 'GOLD' | 'SILVER' | 'BRONZE', athleteId: number,
                    athleteFirstName: string, athleteLastName: string, resultId: number, timeOrPoints: string,
                    sportId: number, sportDisplayName: string, scoreType: string | null): void {
    const localAthlete: Athlete | undefined = this.dataService.athletes().find(a => a.id === athleteId);
    const upperMedal = medal.toUpperCase() as 'GOLD' | 'SILVER' | 'BRONZE';

    // clean up previous holder of the medal slot
    const sport: V2Sport | undefined = this.dataService.sports().find(s => s.rawName === sportRawName);
    const previousHolder: DisciplineParticipant | undefined =
      sport?.participants.find(p => p.medal === upperMedal);
    const previousAthleteId: number | null =
      (previousHolder && previousHolder.athleteId !== athleteId) ? previousHolder.athleteId : null;

    this.dataService.sports.update(list => list.map(s => {
      if (s.rawName !== sportRawName) return s;

      // Remove any existing entry for this athlete OR any existing entry for the same medal
      const filtered: DisciplineParticipant[] = s.participants.filter(
        p => p.athleteId !== athleteId && p.medal !== upperMedal
      );

      const newParticipant: DisciplineParticipant = { athleteId, firstName: athleteFirstName, lastName: athleteLastName,
                                                      medal: upperMedal, result: timeOrPoints, rank: null, resultId,
                                                      countryId: localAthlete?.countryId ?? null,
                                                      countryCode: localAthlete?.countryCode ?? null,
                                                      countryName: localAthlete?.countryName ?? null };

      return { ...s, participants: [...filtered, newParticipant] };
    }));

    // If a different athlete previously held this medal slot, remove their result and decrement their medals
    if (previousAthleteId !== null) {
      this.dataService.leaderboardData.update(data => {
        if (!data) return data;
        return { ...data, athletes: data.athletes.map(a => {
            if (a.id !== previousAthleteId) return a;
            return { ...a,
              results: (a.results ?? []).filter(r => !(r.sportRawName === sportRawName && r.medal === upperMedal)),
            };
          }),
        };
      });

      this._patchAthleteMedals(previousAthleteId, upperMedal, 'remove');
    }

    // Patch the leaderboard raw data — athletes[n].results drives athlete-view expanded rows
    this.dataService.leaderboardData.update(data => {
      if (!data) return data;
      return {...data,
        athletes: data.athletes.map(a => {
          if (a.id !== athleteId) return a;

          // Replace existing result for the same sport, or append a new one
          const existingResults: V2SportResult[] = (a.results ?? []).filter(r => r.sportRawName !== sportRawName);
          const newResult: V2SportResult = { sportId,  sportName: sportDisplayName, sportRawName, scoreType: scoreType as any,
                                             result: timeOrPoints, rank: null, medal: upperMedal };
          return { ...a, results: [...existingResults, newResult] };
        }),
      };
    });

    // Patch local athletes medal counters
    this._patchAthleteMedals(athleteId, upperMedal, 'add');
  }

  /**
   * Patches all local reactive stores after a result deletion.
   *
   * Removes the participant from the affected sport, removes the matching
   * V2SportResult entry from leaderboardData (drives athlete-view rows),
   * decrements the athlete's medal count and recalculates country medals.
   *
   * @param {string}  sportRawName - The rawName of the affected sport.
   * @param {'GOLD'|'SILVER'|'BRONZE'} medal - The medal that was removed.
   * @param {number}  athleteId - The ID of the athlete whose result was deleted.
   */
  patchResultDelete(sportRawName: string, medal: 'GOLD' | 'SILVER' | 'BRONZE', athleteId: number): void {
    const upperMedal = medal.toUpperCase() as 'GOLD' | 'SILVER' | 'BRONZE';

    this.dataService.sports.update(list => list.map(s => {
      if (s.rawName !== sportRawName) return s;
      return { ...s,
        participants: s.participants.filter(p => !(p.athleteId === athleteId && p.medal === upperMedal)),
      };
    }));

    // Remove the V2SportResult entry so athlete-view expanded rows update instantly
    this.dataService.leaderboardData.update(data => {
      if (!data) return data;
      return { ...data, athletes: data.athletes.map(a => {
          if (a.id !== athleteId) return a;
          return { ...a,
            results: (a.results ?? []).filter(r => !(r.sportRawName === sportRawName && r.medal === upperMedal)),
          };
        }),
      };
    });

    this._patchAthleteMedals(athleteId, upperMedal, 'remove');
  }

  /**
   * Adjusts a single medal counter on the local athlete record and
   * triggers a country medal recalculation.
   *
   * @param {number} athleteId - The athlete to patch.
   * @param {'GOLD'|'SILVER'|'BRONZE'} medal - Which medal to adjust.
   * @param {'add'|'remove'} operation - Whether to increment or decrement.
   */
  private _patchAthleteMedals(athleteId: number, medal: 'GOLD' | 'SILVER' | 'BRONZE', operation: 'add' | 'remove'): void {
    const delta: 1 | -1 = operation === 'add' ? 1 : -1;
    let affectedCountryId = 0;

    this.dataService.athletes.update(list => list.map(a => {
      if (a.id !== athleteId) return a;
      affectedCountryId = a.countryId;
      const medals = { ...a.medals };

      if (medal === 'GOLD')   medals.gold   = Math.max(0, medals.gold   + delta);
      if (medal === 'SILVER') medals.silver = Math.max(0, medals.silver + delta);
      if (medal === 'BRONZE') medals.bronze = Math.max(0, medals.bronze + delta);
      return { ...a, medals };
    }));

    // Also patch the leaderboard raw data so detailed athlete views stay correct
    this.dataService.leaderboardData.update(data => {
      if (!data) return data;
      return {...data, athletes: data.athletes.map(a => {
          if (a.id !== athleteId) return a;
          const m = { ...a.medals };

          if (medal === 'GOLD')   m.gold   = Math.max(0, m.gold   + delta);
          if (medal === 'SILVER') m.silver = Math.max(0, m.silver + delta);
          if (medal === 'BRONZE') m.bronze = Math.max(0, m.bronze + delta);
          m.total = m.gold + m.silver + m.bronze;
          return { ...a, medals: m };
        }),
      };
    });

    if (affectedCountryId) {
      this.miscService.recalcCountryMedals(affectedCountryId);
    }
  }
}






