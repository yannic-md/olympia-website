import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private http: HttpClient) {}

  /**
   * Deletes an country by their ID.
   *
   * @param {number} id - The unique ID of the country to delete.
   * @returns {Observable<void>} Observable that completes on success.
   */
  deleteCountry(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/countries/${id}`);
  }
}
