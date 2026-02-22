import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';
import {ScoreType} from "../../../types/Athlete";

@Injectable({
  providedIn: 'root'
})
export class AthleteService {

  constructor(private http: HttpClient) {}

  /**
   * Fetches all athletes from the backend.
   *
   * @returns {Observable<any[]>} Observable with the list of all athletes.
   */
  getAllAthletes(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/athletes`);
  }

  /**
   * Creates a new athlete.
   *
   * @param {Object} data - The creation payload.
   * @returns {Observable<any>} Observable with the created athlete.
   */
  createAthlete(data: { firstName: string; lastName: string; countryId: number;
                         goldMedals: number; silverMedals: number; bronzeMedals: number;
                         bestTime: string | null; sport: string;
                         scoreType: ScoreType | null }): Observable<any> {
    return this.http.post(`${API_URL}/athletes`, data);
  }

  /**
   * Updates an existing athlete by their ID.
   *
   * @param {number} id - The unique ID of the athlete to update.
   * @param {Object} data - The update payload.
   * @returns {Observable<any>} Observable with the updated athlete.
   */
  updateAthlete(id: number, data: { firstName: string; lastName: string; countryId: number;
                                     goldMedals: number; silverMedals: number; bronzeMedals: number;
                                     bestTime: string | null; sport: string;
                                     scoreType: ScoreType | null }): Observable<any> {
    return this.http.put(`${API_URL}/athletes/${id}`, data);
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
}
