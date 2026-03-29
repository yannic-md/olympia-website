import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../types/API';
import { ImportResponse } from '../../../types/Importer';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private readonly API_BASE = `${API_URL}/imports`;

  constructor(private http: HttpClient) {}

  /**
   * Upload and import countries from a file
   * Supports Excel (.xlsx, .xls) formats
   *
   * @param file The file to import
   * @returns Observable of the import response
   */
  importCountries(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResponse>(`${this.API_BASE}/countries`, formData);
  }

  /**
   * Upload and import athletes from a file
   * Supports Excel (.xlsx, .xls) formats
   *
   * @param file The file to import
   * @returns Observable of the import response
   */
  importAthletes(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResponse>(`${this.API_BASE}/athletes`, formData);
  }

  /**
   * Upload and import results/disciplines from a file.
   * Supports Excel (.xlsx, .xls) formats.
   *
   * @param {File} file - The file to import.
   * @returns {Observable<ImportResponse>} Observable of the import response.
   */
  importResults(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResponse>(`${this.API_BASE}/results`, formData);
  }
}



