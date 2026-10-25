import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoggerService } from './logger-service';
import { environment } from '@environments/environment';

describe('LoggerService', () => {
  let service: LoggerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(LoggerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être initialisé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait envoyer une erreur formatée au serveur', () => {
    const error = new Error('Test error message');
    service.error('Erreur lors du traitement', 'TestComponent', error);

    const req = httpMock.expectOne(`${environment.BASE_API_URL}/api/logs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.level).toBe('ERROR');
    expect(req.request.body.message).toContain('Erreur lors du traitement');
    expect(req.request.body.message).toContain('Test error message');
    expect(req.request.body.context).toBe('TestComponent');
    expect(req.request.body.stack).toBeDefined();
    expect(req.request.body.timestamp).toBeDefined();

    req.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('devrait supporter un objet HTTP ou inconnu dans error()', () => {
    const httpError = { error: { message: 'Ressource introuvable' }, status: 404 };
    service.error('Échec API', 'HttpService', httpError);

    const req = httpMock.expectOne(`${environment.BASE_API_URL}/api/logs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.level).toBe('ERROR');
    expect(req.request.body.message).toBe('Échec API — Ressource introuvable');
    expect(req.request.body.context).toBe('HttpService');

    req.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('devrait envoyer un avertissement (WARN) au serveur', () => {
    service.warn('Session bientôt expirée', 'AuthGuard', { timeLeft: 60 });

    const req = httpMock.expectOne(`${environment.BASE_API_URL}/api/logs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.level).toBe('WARN');
    expect(req.request.body.message).toContain('Session bientôt expirée');
    expect(req.request.body.message).toContain('{"timeLeft":60}');
    expect(req.request.body.context).toBe('AuthGuard');

    req.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('devrait envoyer une information (INFO) au serveur', () => {
    service.info('Utilisateur connecté', 'LoginComponent');

    const req = httpMock.expectOne(`${environment.BASE_API_URL}/api/logs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.level).toBe('INFO');
    expect(req.request.body.message).toBe('Utilisateur connecté');
    expect(req.request.body.context).toBe('LoginComponent');

    req.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('ne devrait pas lever d\'exception si l\'appel réseau échoue (échec silencieux)', () => {
    expect(() => {
      service.error('Erreur critique');
      const req = httpMock.expectOne(`${environment.BASE_API_URL}/api/logs`);
      req.error(new ProgressEvent('Network error'));
    }).not.toThrow();
  });
});
