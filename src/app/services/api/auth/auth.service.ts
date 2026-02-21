import {Inject, Injectable, PLATFORM_ID, signal, WritableSignal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {isPlatformBrowser} from "@angular/common";
import {API_URL, AuthUser, LoginResponse} from "../../../types/API";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_user';

  currentUser: WritableSignal<AuthUser | null> = signal(this.loadFromStorage());

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {}

  /**
   * Sends login credentials to the backend and persists the authenticated user on success.
   *
   * @param {string} username - The username of the user attempting to log in.
   * @param {string} password - The plaintext password of the user.
   * @returns {Observable<LoginResponse>} that emits the server's login response.
   */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, {username, password}).pipe(
      tap(response => this.persistUser(response, password))
    );
  }

  /**
   * Sends a registration request to the backend and persists the authenticated user on success.
   *
   * @param {string} username - The desired username for the new account.
   * @param {string} password - The plaintext password for the new account.
   * @returns {Observable<LoginResponse>} Observable that emits the server's registration response.
   */
  register(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/register`, {username, password}).pipe(
      tap(response => this.persistUser(response, password))
    );
  }

  /**
   * Returns the Basic Auth header value for the current user.
   */
  getBasicAuthHeader(): string | null {
    const user: AuthUser | null = this.currentUser();
    if (!user) return null;
    return 'Basic ' + btoa(`${user.username}:${user.password}`);
  }

  /**
   * Checks if the current user is logged in.
   */
  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Persists the authenticated user in local storage and updates the current user signal.
   *
   * @param {LoginResponse} response The login or registration response containing user data.
   * @param {string} password The plaintext password used during authentication.
   */
  private persistUser(response: LoginResponse, password: string): void {
    const user: AuthUser = {id: response.id, username: response.username, role: response.role, password};
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  /**
   * Loads the authenticated user from `localStorage` if running in a browser environment.
   * If the platform is not a browser, it returns `null` to avoid accessing `localStorage`.
   *
   * @returns {AuthUser | null} The deserialized `AuthUser` object if present, otherwise `null`.
   */
  private loadFromStorage(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) { return null; }

    const stored: string | null = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
