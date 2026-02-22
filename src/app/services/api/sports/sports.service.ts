import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';
import { ScoreType } from '../../../types/Athlete';

export interface SportEntry {
  name: string;
  rawName: string;
  scoreType: ScoreType;
}

@Injectable({
  providedIn: 'root'
})
export class SportsService {

  constructor(private http: HttpClient) {}

  /**
   * Fetches all sports from the public backend endpoint.
   * Returns translated name, raw DB name and scoreType per sport.
   *
   * @param {string} lang - Language code for translation (en, de, fr).
   * @returns {Observable<SportEntry[]>} Observable with the list of sports.
   */
  getAllSports(lang: string): Observable<SportEntry[]> {
    return this.http.get<SportEntry[]>(`${API_URL}/public/sports?lang=${lang}`);
  }
}


