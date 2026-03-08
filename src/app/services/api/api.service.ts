import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {API_URL, LeaderboardResponse} from '../../types/API';

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
}

