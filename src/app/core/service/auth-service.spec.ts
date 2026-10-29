import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth-service';
import { AuthRepository } from '@repositories/auth-repository';
import { LoggerService } from './logger-service';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let mockRouter: { navigate: ReturnType<typeof vi.fn>; url: string };
  let mockAuthRepo: { getMe: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };
  let mockLogger: { error: ReturnType<typeof vi.fn> };

  const createFakeJwt = (sub: string, expInSeconds: number): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub, exp: expInSeconds }));
    const signature = 'fake_signature';
    return `${header}.${payload}.${signature}`;
  };

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn(),
      url: '/dashboard',
    };

    mockAuthRepo = {
      getMe: vi.fn().mockReturnValue(of({ id: 1, username: 'testuser' })),
      login: vi.fn(),
      register: vi.fn(),
    };

    mockLogger = {
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: AuthRepository, useValue: mockAuthRepo },
        { provide: LoggerService, useValue: mockLogger },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    // Nettoyer les cookies de test
    document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
  });

  it('devrait détecter si un token JWT est expiré', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 heure dans le passé
    const expiredToken = createFakeJwt('user1', pastExp);
    expect(service.isTokenExpired(expiredToken)).toBe(true);

    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 heure dans le futur
    const validToken = createFakeJwt('user1', futureExp);
    expect(service.isTokenExpired(validToken)).toBe(false);

    expect(service.isTokenExpired(null)).toBe(true);
    expect(service.isTokenExpired('invalid.token')).toBe(true);
  });

  it('devrait déconnecter l\'utilisateur et rediriger vers /login lors de l\'appel à logout()', () => {
    // Simuler un token stocké
    document.cookie = 'jwt_token=mock_jwt; path=/;';
    (service as any).tokenSignal.set('mock_jwt');
    (service as any).profileSignal.set({ id: 1, username: 'testuser' });

    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.currentUserProfile()).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    expect(document.cookie).not.toContain('jwt_token=mock_jwt');
  });

  it('ne devrait pas naviguer vers /login si l\'utilisateur est déjà sur /login', () => {
    mockRouter.url = '/login';
    service.logout();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('devrait déconnecter l\'utilisateur lorsque getMe renvoie une erreur 401 Unauthorized', () => {
    vi.spyOn(service, 'logout');
    mockAuthRepo.getMe.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })));

    (service as any).loadUserProfile();

    expect(service.logout).toHaveBeenCalled();
  });
});
