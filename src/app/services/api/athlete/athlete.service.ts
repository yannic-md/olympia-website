import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';
import {Athlete, AthletePayload, V2Athlete} from "../../../types/Athlete";
import {DataHolderService} from "../../data-holder/data-holder.service";
import {MiscService} from "../../misc/misc.service";

@Injectable({
  providedIn: 'root'
})
export class AthleteService {

  constructor(private http: HttpClient, private dataService: DataHolderService, private miscService: MiscService) {}

  /**
   * Creates a new athlete.
   *
   * @param {AthletePayload} data - The creation payload.
   * @returns {Observable<V2Athlete>} Observable with the created athlete.
   */
  createAthlete(data: AthletePayload): Observable<V2Athlete> {
    return this.http.post<V2Athlete>(`${API_URL}/athletes`, data);
  }

  /**
   * Updates an existing athlete by their ID.
   *
   * @param {number} id - The unique ID of the athlete to update.
   * @param {AthletePayload} data - The update payload.
   * @returns {Observable<V2Athlete>} Observable with the updated athlete.
   */
  updateAthlete(id: number, data: AthletePayload): Observable<V2Athlete> {
    return this.http.put<V2Athlete>(`${API_URL}/athletes/${id}`, data);
  }

  /**
   * Deletes an athlete by their ID.
   *
   * @param {number} id - The unique ID of the athlete to delete.
   * @returns {Observable<void>} Observable that completes on success.
   */
  deleteAthlete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/athletes/${id}`);
  }

  // *----------------------------------------------*
  //            HELPER - METHODS
  // *----------------------------------------------*

  /**
   * Inserts a newly created athlete into all reactive stores.
   * The `leaderboardData` raw store receives a minimal V2Athlete shell so that
   * `resultsForAthlete()` in the athlete-view does not break.
   *
   * @param {V2Athlete} api - The API response returned after creation.
   * @param {Athlete} mapped - Pre-built legacy Athlete object to push into `athletes`.
   */
  patchAthleteAdd(api: V2Athlete, mapped: Athlete): void {
    this.dataService.athletes.update(list => [...list, mapped]);

    // Insert a minimal V2Athlete shell so resultsForAthlete() can find it
    this.dataService.leaderboardData.update(data => {
      if (!data) return data;
      const shell: V2Athlete = {
        id: api.id, firstName: api.firstName, lastName: api.lastName, leaderboardRank: 0, results: [],
        country: api.country ? { id: api.country.id, code: api.country.code, name: api.country.name } : null,
        medals: { gold: mapped.medals.gold, silver: mapped.medals.silver, bronze: mapped.medals.bronze, total: 0 } };
      return { ...data, athletes: [...data.athletes, shell] };
    });

    // Update countryMedals if the athlete already has medals
    if (mapped.medals.gold || mapped.medals.silver || mapped.medals.bronze) {
      this.miscService.recalcCountryMedals(mapped.countryId);
    }
  }

  /**
   * Updates an existing athlete across all reactive stores.
   * Only name, country and medal data are patched locally; sport/result details
   * are kept from the previous state until the next full reload.
   *
   * @param {V2Athlete} api - The API response returned after the update.
   * @param {Athlete} updated - The updated legacy Athlete object.
   * @param {number} previousCountryId - The country ID before the update (for medal recalc).
   */
  patchAthleteUpdate(api: V2Athlete, updated: Athlete, previousCountryId: number): void {
    this.dataService.athletes.update(list =>
      list.map(a => a.id === updated.id ? { ...a, ...updated } : a)
    );

    this.dataService.leaderboardData.update(data => {
      if (!data) return data;
      return { ...data,
        athletes: data.athletes.map(a => a.id === api.id ? {
          ...a, firstName: api.firstName, lastName: api.lastName,
          country: api.country ? { id: api.country.id, code: api.country.code, name: api.country.name } : null,
          medals: { gold: updated.medals.gold, silver: updated.medals.silver,
            bronze: updated.medals.bronze, total: updated.medals.gold + updated.medals.silver + updated.medals.bronze },
        } : a),
      };
    });

    // Recalc medals for old and new country
    if (previousCountryId !== updated.countryId) {
      this.miscService.recalcCountryMedals(previousCountryId);
    }
    this.miscService.recalcCountryMedals(updated.countryId);

    // Patch participant name/country in sports store
    this.dataService.sports.update(list => list.map(s => ({
      ...s,
      participants: s.participants.map(p => p.athleteId !== api.id ? p : {
        ...p, firstName: api.firstName, lastName: api.lastName,
        countryId: api.country?.id ?? p.countryId,
        countryCode: api.country?.code ?? p.countryCode,
        countryName: api.country?.name ?? p.countryName,
      }),
    })));
  }

  /**
   * Removes a deleted athlete from all reactive stores and recalculates the
   * affected country's medal totals.
   *
   * @param {number} athleteId - The ID of the deleted athlete.
   * @param {number} countryId - The country ID the athlete belonged to.
   */
  patchAthleteDelete(athleteId: number, countryId: number): void {
    this.dataService.athletes.update(list => list.filter(a => a.id !== athleteId));

    this.dataService.leaderboardData.update(data => {
      if (!data) return data;
      return { ...data, athletes: data.athletes.filter(a => a.id !== athleteId) };
    });

    this.dataService.sports.update(list => list.map(s => ({
      ...s, participants: s.participants.filter(p => p.athleteId !== athleteId),
    })));

    this.miscService.recalcCountryMedals(countryId);
  }
}
