import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

export interface LoginResponse {
  success: boolean;
  token?: string;
  displayName?: string;
  companyName?: string;
  warehouseName?: string;
  username?: string;
  ownerId?: number;
  message?: string;
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'jwt_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api';
  private readonly isBrowser: boolean;

  /** Reactive signal — true if user has an active session */
  readonly isLoggedIn = signal<boolean>(false);
  readonly currentUser = signal<LoginResponse | null>(null);

  private http = inject(HttpClient);

  constructor() {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    // Restore state from localStorage on service init (browser only)
    if (this.isBrowser) {
      this.restoreFromStorage();
    }
  }

  /** Get the stored JWT token */
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((res) => {
          if (res.success && res.token) {
            if (this.isBrowser) {
              localStorage.setItem(TOKEN_KEY, res.token);
            }
            const userData: LoginResponse = {
              success: true,
              displayName: res.displayName,
              companyName: res.companyName,
              warehouseName: res.warehouseName,
              username: res.username,
              ownerId: res.ownerId,
            };
            if (this.isBrowser) {
              localStorage.setItem(USER_KEY, JSON.stringify(userData));
            }
            this.isLoggedIn.set(true);
            this.currentUser.set(userData);
          }
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.clearAuth();
        })
      );
  }

  /** Check if stored token is still valid (used on page refresh) */
  checkSession(): Observable<LoginResponse> {
    const token = this.getToken();
    if (!token) {
      return of({ success: false, message: 'No token' } as LoginResponse);
    }

    // Validate the token against the backend
    return this.http
      .get<LoginResponse>(`${this.apiUrl}/session`)
      .pipe(
        tap((res) => {
          if (res.success) {
            const userData: LoginResponse = {
              success: true,
              displayName: res.displayName,
              companyName: res.companyName,
              warehouseName: res.warehouseName,
              username: res.username,
              ownerId: res.ownerId,
            };
            if (this.isBrowser) {
              localStorage.setItem(USER_KEY, JSON.stringify(userData));
            }
            this.isLoggedIn.set(true);
            this.currentUser.set(userData);
          } else {
            this.clearAuth();
          }
        })
      );
  }

  /** Clear all auth data from localStorage and signals */
  private clearAuth(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  /** Restore auth state from localStorage (called on service init) */
  private restoreFromStorage(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as LoginResponse;
        this.isLoggedIn.set(true);
        this.currentUser.set(user);
      } catch {
        this.clearAuth();
      }
    }
  }
}
