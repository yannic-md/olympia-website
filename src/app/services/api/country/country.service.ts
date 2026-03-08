import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';
import {FormCountryPayload, V2Country} from "../../../types/Country";

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private http: HttpClient) {}

  /**
   * Creates a new country.
   *
   * @param {FormCountryPayload} data - The creation payload with code, name and optional translations.
   * @returns {Observable<V2Country>} Observable with the created country.
   */
  createCountry(data: FormCountryPayload): Observable<V2Country> {
    return this.http.post<V2Country>(`${API_URL}/countries`, data);
  }

  /**
   * Updates an existing country by their ID.
   *
   * @param {number} id - The unique ID of the country to update.
   * @param {FormCountryPayload} data - The update payload with code, name and optional translations.
   * @returns {Observable<V2Country>} Observable with the updated country.
   */
  updateCountry(id: number, data: FormCountryPayload): Observable<V2Country> {
    return this.http.put<V2Country>(`${API_URL}/countries/${id}`, data);
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
