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
   * Fetches all countries from the backend.
   *
   * @returns {Observable<any[]>} Observable with the list of all countries.
   */
  getAllCountries(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/countries`);
  }

  /**
   * Creates a new country.
   *
   * @param {Object} data - The creation payload with code and name.
   * @returns {Observable<any>} Observable with the created country.
   */
  createCountry(data: { code: string; name: string }): Observable<any> {
    return this.http.post(`${API_URL}/countries`, data);
  }

  /**
   * Updates an existing country by their ID.
   *
   * @param {number} id - The unique ID of the country to update.
   * @param {Object} data - The update payload with code and name.
   * @returns {Observable<any>} Observable with the updated country.
   */
  updateCountry(id: number, data: { code: string; name: string }): Observable<any> {
    return this.http.put(`${API_URL}/countries/${id}`, data);
  }

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
