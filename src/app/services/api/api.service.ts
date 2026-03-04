import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {API_URL, LeaderboardResponse} from '../../types/API';
import {V2Country} from "../../types/Country";
import {V2Athlete} from "../../types/Athlete";
import {V2Sport} from "../../types/Disciplines";

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(private http: HttpClient) {}

  /**
   * Fetches the full combined leaderboard payload (sports + athletes + countries).
   *
   * @param {string} lang - Language code (en, de, fr).
   * @returns {Observable<LeaderboardResponse>}
   */
  getLeaderboard(lang: string): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${API_URL}/v2/public/leaderboard?lang=${lang}`);
  }

  /**
   * Fetches only the country list with aggregated medals and athlete sub-lists.
   *
   * @param {string} lang - Language code (en, de, fr).
   * @returns {Observable<V2Country[]>}
   */
  getCountries(lang: string): Observable<V2Country[]> {
    return this.http.get<V2Country[]>(`${API_URL}/v2/public/countries?lang=${lang}`);
  }

  /**
   * Fetches only the athlete list.
   *
   * @param {string} lang - Language code (en, de, fr).
   * @returns {Observable<V2Athlete[]>}
   */
  getAthletes(lang: string): Observable<V2Athlete[]> {
    return this.http.get<V2Athlete[]>(`${API_URL}/v2/public/athletes?lang=${lang}`);
  }

  /**
   * Fetches only the sports list with participant sub-lists.
   *
   * @param {string} lang - Language code (en, de, fr).
   * @returns {Observable<V2Sport[]>}
   */
  getSports(lang: string): Observable<V2Sport[]> {
    return this.http.get<V2Sport[]>(`${API_URL}/v2/public/sports?lang=${lang}`);
  }
}

