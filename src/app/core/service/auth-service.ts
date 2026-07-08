import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, REQUEST, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../model/auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly BASE_URL = environment.BASE_API_URL;

  private readonly tokenSignal = signal<string | null>(this.getInitialToken());

  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly currentUsername = computed(() => {
    const token = this.tokenSignal();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || 'Utilisateur';
    } catch {
      return 'Utilisateur';
    }
  });

  private getInitialToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getCookie('jwt_token');
      console.log('[Auth] Browser initial token:', token ? 'Found' : 'Not found', 'Cookies:', typeof document !== 'undefined' ? document.cookie : 'no document');
      return token;
    } else if (isPlatformServer(this.platformId) && this.request) {
      let cookieHeader = '';
      
      if (this.request.headers) {
        if (typeof this.request.headers.get === 'function') {
          cookieHeader = this.request.headers.get('cookie') || '';
        } else {
          const rawHeaders = this.request.headers as any;
          cookieHeader = rawHeaders['cookie'] || rawHeaders['Cookie'] || '';
        }
      }
      
      const token = this.parseCookie(cookieHeader, 'jwt_token');
      console.log('[Auth] Server initial token:', token ? 'Found' : 'Not found', 'Cookie Header:', cookieHeader);
      return token;
    }
    console.log('[Auth] getInitialToken: no platform matched or no request.');
    return null;
  }

  /** Executes the getToken action. */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /** Executes the authenticate action. */
  private authenticate(response: AuthResponse) {
    if (response.token) {
      if (isPlatformBrowser(this.platformId)) {
        this.setCookie('jwt_token', response.token, 7); // Keep connected for 7 days
      }
      this.tokenSignal.set(response.token);
      this.router.navigate(['/dashboard']);
    }
  }

  /** Executes the login action. */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.BASE_URL + '/api/auth/login', request).pipe(
      tap((res) => this.authenticate(res))
    );
  }

  /** Executes the register action. */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.BASE_URL + '/api/auth/register', request)
      .pipe(tap((res) => this.authenticate(res)));
  }

  /** Executes the logout action. */
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      this.deleteCookie('jwt_token');
    }
    this.tokenSignal.set(null);
    this.router.navigate(['/login']);
  }

  // === COOKIE HELPERS ===

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    return this.parseCookie(document.cookie, name);
  }

  private parseCookie(cookieString: string, name: string): string | null {
    if (!cookieString) return null;
    const matches = cookieString.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
  }

  private setCookie(name: string, value: string, days: number) {
    if (typeof document === 'undefined') return;
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? "; secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Strict${secureFlag}`;
  }

  private deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? "; secure" : "";
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict${secureFlag}`;
  }
}
