import {Inject, Injectable, PLATFORM_ID, signal, WritableSignal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {isPlatformBrowser} from "@angular/common";
import {API_URL, AuthUser, LoginResponse} from "../../../types/API";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser: WritableSignal<AuthUser | null> = signal(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {
    // Restore session from cookie on startup (browser only)
    if (isPlatformBrowser(this.platformId)) {
      this.restoreSession();
    }
  }

  /**
   * Sends login credentials to the backend. The backend sets a session cookie (24h).
   *
   * @param {string} username - The username of the user.
   * @param {string} password - The plaintext password.
   * @returns {Observable<LoginResponse>} that emits the server's login response.
   */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, {username, password}, {withCredentials: true}).pipe(
      tap(response => this.persistUser(response))
    );
  }

  /**
   * Sends a registration request to the backend.
   *
   * @param {string} username - The desired username.
   * @param {string} password - The plaintext password.
   * @returns {Observable<LoginResponse>} Observable that emits the server's registration response.
   */
  register(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/register`, {username, password}, {withCredentials: true}).pipe(
      tap(response => this.persistUser(response))
    );
  }

  /**
   * Logs out the current user by invalidating the session on the backend.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/logout`, {}, {withCredentials: true}).pipe(
      tap(() => this.currentUser.set(null))
    );
  }

  /**
   * Checks if the current user is logged in.
   */
  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Restores the authenticated user from an existing session cookie by calling /api/auth/me.
   * Clears any stale localStorage auth data from the previous Basic Auth approach.
   */
  private restoreSession(): void {
    // Clean up old localStorage data from the previous Basic Auth approach
    localStorage.removeItem('auth_user');

    this.http.get<LoginResponse>(`${API_URL}/auth/me`, {withCredentials: true}).subscribe({
      next: (response) => this.persistUser(response),
      error: () => this.currentUser.set(null)
    });
  }

  /**
   * Updates the current user signal with the data from the login/register response.
   *
   * @param {LoginResponse} response The login or registration response.
   */
  private persistUser(response: LoginResponse): void {
    const user: AuthUser = {id: response.id, username: response.username, role: response.role};
    this.currentUser.set(user);
  }
}


