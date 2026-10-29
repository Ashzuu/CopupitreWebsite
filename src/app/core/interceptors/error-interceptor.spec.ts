import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BYPASS_GLOBAL_ERROR, errorInterceptor } from './error-interceptor';
import { NotifService } from '@services/notif-service';
import { AuthService } from '@services/auth-service';
import { vi } from 'vitest';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let notifService: NotifService;
  let mockAuthService: { logout: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = {
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        NotifService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    notifService = TestBed.inject(NotifService);
    vi.spyOn(notifService, 'showError');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('devrait intercepter un code HTTP 400 et afficher le message métier du backend avec le titre "Erreur"', () => {
    httpClient.post('/api/test', {}).subscribe({
      error: (err) => {
        expect(err._notificationShown).toBe(true);
      },
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush(
      { error: 'Vous avez déjà postulé à cette annonce', message: 'Vous avez déjà postulé à cette annonce' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(notifService.showError).toHaveBeenCalledWith(
      'Vous avez déjà postulé à cette annonce',
      'Erreur'
    );
  });

  it('devrait intercepter un code HTTP 401 sur une route protégée, déconnecter l\'utilisateur et afficher une notification', () => {
    httpClient.get('/api/users/me').subscribe({
      error: (err) => {
        expect(err._notificationShown).toBe(true);
      },
    });

    const req = httpTestingController.expectOne('/api/users/me');
    req.flush(
      { message: 'Token JWT invalide ou expiré' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(notifService.showError).toHaveBeenCalledWith(
      'Token JWT invalide ou expiré',
      'Session expirée'
    );
  });

  it('ne devrait pas déconnecter l\'utilisateur si le 401 provient du endpoint /api/auth/login', () => {
    httpClient.post('/api/auth/login', {}).subscribe({
      error: (err) => {
        expect(err._notificationShown).toBe(true);
      },
    });

    const req = httpTestingController.expectOne('/api/auth/login');
    req.flush(
      { username: 'Identifiants incorrects' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(mockAuthService.logout).not.toHaveBeenCalled();
    expect(notifService.showError).toHaveBeenCalledWith(
      'Identifiants incorrects',
      'Connexion échouée'
    );
  });

  it('devrait intercepter un code HTTP 403 avec message métier et titre "Accès interdit"', () => {
    httpClient.get('/api/admin').subscribe({
      error: (err) => {
        expect(err._notificationShown).toBe(true);
      },
    });

    const req = httpTestingController.expectOne('/api/admin');
    req.flush(
      { message: 'Vous devez être administrateur' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(notifService.showError).toHaveBeenCalledWith(
      'Vous devez être administrateur',
      'Accès interdit'
    );
  });

  it('devrait gérer une erreur réseau avec statut 0', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {},
    });

    const req = httpTestingController.expectOne('/api/test');
    req.error(new ProgressEvent('error'), { status: 0 });

    expect(notifService.showError).toHaveBeenCalledWith(
      'Impossible de contacter le serveur. Veuillez vérifier votre connexion internet.',
      'Serveur inaccessible'
    );
  });

  it('devrait respecter le token BYPASS_GLOBAL_ERROR et ne pas afficher de notification', () => {
    httpClient
      .get('/api/test', {
        context: new HttpContext().set(BYPASS_GLOBAL_ERROR, true),
      })
      .subscribe({
        error: () => {},
      });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ error: 'Erreur silencieuse' }, { status: 500, statusText: 'Server Error' });

    expect(notifService.showError).not.toHaveBeenCalled();
  });
});
