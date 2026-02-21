import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';

@Injectable({
  providedIn: 'root'
})
export class AthleteService {

  constructor(private http: HttpClient) {}

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
