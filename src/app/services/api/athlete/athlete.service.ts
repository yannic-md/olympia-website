import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';
import {AthletePayload, V2Athlete} from "../../../types/Athlete";
import {DataHolderService} from "../../data-holder/data-holder.service";
import {MiscService} from "../../misc/misc.service";
import {TranslateService} from "@ngx-translate/core";
import {V2CountryRef} from "../../../types/Country";

@Injectable({
  providedIn: 'root'
})
export class AthleteService {

  constructor(private http: HttpClient, private dataService: DataHolderService,
              private miscService: MiscService, private translateService: TranslateService) {}

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
   *
   * @param {V2Athlete} api - The API response returned after creation.
   */
  patchAthleteAdd(api: V2Athlete): void {
    const normalised: V2Athlete = this._normalisedAthlete(api);
    this.dataService.athletes.update(list => [...list, normalised]);

    this.dataService.leaderboardData.update(data => {
      if (!data) return data;
      return { ...data, athletes: [...data.athletes, normalised] };
    });

    // Update countryMedals if the athlete already has medals
    if (normalised.medals.gold || normalised.medals.silver || normalised.medals.bronze) {
      this.miscService.recalcCountryMedals(normalised.country?.id ?? 0);
    }
  }

  /**
   * Updates an existing athlete across all reactive stores.
   *
   * @param {V2Athlete} api - The API response returned after the update.
   * @param {number} previousCountryId - The country ID before the update (for medal recalc).
   */
  patchAthleteUpdate(api: V2Athlete, previousCountryId: number): void {
    const normalised: V2Athlete = this._normalisedAthlete(api);

    this.dataService.athletes.update(list =>
      list.map(a => a.id === normalised.id ? { ...a, ...normalised } : a)
    );

    this.dataService.leaderboardData.update(data => {
      if (!data) return data;
      return { ...data, athletes: data.athletes.map(a => a.id === normalised.id ? { ...a, ...normalised } : a) };
    });

    // Recalc medals for old and new country
    if (previousCountryId !== (normalised.country?.id ?? 0)) {
      this.miscService.recalcCountryMedals(previousCountryId);
    }
    this.miscService.recalcCountryMedals(normalised.country?.id ?? 0);

    this.dataService.sports.update(list => list.map(s => ({
      ...s,
      participants: s.participants.map(p => p.athleteId !== normalised.id ? p : {
        ...p, firstName: normalised.firstName, lastName: normalised.lastName,
        countryId: normalised.country?.id ?? p.countryId,
        countryCode: normalised.country?.code ?? p.countryCode,
        countryName: normalised.country?.name ?? p.countryName,
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

  /**
   * Resolves the localised display name for a country ref based on the active language.
   * Falls back to the raw `name` if no translation is available.
   */
  private resolveCountryName(country: V2CountryRef): string {
    const lang: string = this.translateService.getCurrentLang() || 'en';
    if (lang === 'de') return country.nameDe || country.nameEn || country.name;
    if (lang === 'fr') return country.nameFr || country.nameEn || country.name;
    return country.nameEn || country.name;
  }

  /**
   * Returns a copy of the athlete with the country name resolved to the active language
   * and safe defaults for `medals` and `results` in case the API omits them.
   */
  private _normalisedAthlete(api: V2Athlete): V2Athlete {
    return {
      ...api,
      medals: api.medals ?? { gold: 0, silver: 0, bronze: 0, total: 0 },
      results: api.results ?? [],
      country: api.country ? { ...api.country, name: this.resolveCountryName(api.country) } : null,
    };
  }
}
