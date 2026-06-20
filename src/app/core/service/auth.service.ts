import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { ValueChangeEvent } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
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
      return localStorage.getItem('jwt_token');
    }
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
        localStorage.setItem('jwt_token', response.token);
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
      localStorage.removeItem('jwt_token');
    }
    this.tokenSignal.set(null);
    this.router.navigate(['/login']);
  }
}
