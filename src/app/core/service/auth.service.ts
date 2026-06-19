import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.getInitialToken());

  /** The isAuthenticated property. */
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  /** The currentUsername property. */
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

  /** Executes the login action. */
  login(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('jwt_token', token);
    }
    this.tokenSignal.set(token);
    this.router.navigate(['/dashboard']);
  }

  /** Executes the logout action. */
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwt_token');
    }
    this.tokenSignal.set(null);
    this.router.navigate(['/']);
  }
}
