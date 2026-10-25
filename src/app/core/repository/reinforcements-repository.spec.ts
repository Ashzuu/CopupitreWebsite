import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReinforcementsRepository } from './reinforcements-repository';
import { ReinforcementAnnouncement, ReinforcementResponse } from '../model';
import { environment } from '@environments/environment';

describe('ReinforcementsRepository', () => {
  let repository: ReinforcementsRepository;
  let httpTestingController: HttpTestingController;
  const baseUrl = environment.BASE_API_URL;

  const mockAnnouncement: ReinforcementAnnouncement = {
    id: 1,
    organizationId: 10,
    title: 'Besoin trompette concert',
    organizationName: 'Harmonie de Paris',
    instrumentNeeded: 'Trompette',
    eventDate: '2026-11-20T20:00:00Z',
    deadline: '2026-11-15T23:59:59Z',
    location: 'Paris',
    description: 'Concert annuel',
    requiredCount: 2,
    validatedCount: 1,
    status: 'OPEN',
    createdAt: '2026-10-01T10:00:00Z',
  };

  const mockResponse: ReinforcementResponse = {
    id: 100,
    announcementId: 1,
    announcementTitle: 'Besoin trompette concert',
    respondentUsername: 'trompettiste75',
    respondentFullName: 'Jean Dupont',
    respondentInstrument: 'Trompette',
    respondedAt: '2026-10-05T12:00:00Z',
    status: 'PENDING',
    message: 'Disponible et motivé pour ce programme',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReinforcementsRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    repository = TestBed.inject(ReinforcementsRepository);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('devrait être initialisé', () => {
    expect(repository).toBeTruthy();
  });

  it('devrait récupérer toutes les annonces via getAll()', () => {
    repository.getAll().subscribe((announcements) => {
      expect(announcements).toEqual([mockAnnouncement]);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/reinforcements/all`);
    expect(req.request.method).toBe('GET');
    req.flush([mockAnnouncement]);
  });

  it('devrait récupérer mes annonces via getMyReinforcementAnnouncements()', () => {
    repository.getMyReinforcementAnnouncements().subscribe((announcements) => {
      expect(announcements).toEqual([mockAnnouncement]);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/reinforcements/me`);
    expect(req.request.method).toBe('GET');
    req.flush([mockAnnouncement]);
  });

  it('devrait récupérer les candidatures de l\'utilisateur connecté via getMyApplications() (US-RENF-03)', () => {
    repository.getMyApplications().subscribe((apps) => {
      expect(apps).toEqual([mockResponse]);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/reinforcements/my-applications`);
    expect(req.request.method).toBe('GET');
    req.flush([mockResponse]);
  });

  it('devrait récupérer les réponses d\'une annonce via getResponsesForAnnouncement()', () => {
    repository.getResponsesForAnnouncement(1).subscribe((responses) => {
      expect(responses).toEqual([mockResponse]);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/reinforcements/1/responses`);
    expect(req.request.method).toBe('GET');
    req.flush([mockResponse]);
  });

  it('devrait créer une annonce via createAnnouncement() (US-RENF-01)', () => {
    const payload = { title: 'Nouvelle annonce', instrumentNeeded: 'Clarinette' };

    repository.createAnnouncement(payload).subscribe((res) => {
      expect(res).toEqual(mockAnnouncement);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/reinforcements/save`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockAnnouncement);
  });

  it('devrait postuler à une annonce via applyToAnnouncement() (US-RENF-03 / RG-RENF-10)', () => {
    repository.applyToAnnouncement(1, 'Je suis dispo').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/reinforcements/1/apply`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'Je suis dispo' });
    req.flush(mockResponse);
  });

  it('devrait mettre à jour le statut d\'une candidature via updateApplicationStatus() (US-RENF-04)', () => {
    const updatedResponse: ReinforcementResponse = { ...mockResponse, status: 'ACCEPTED' };

    repository.updateApplicationStatus(1, 100, 'ACCEPTED').subscribe((res) => {
      expect(res.status).toBe('ACCEPTED');
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/reinforcements/1/applications/100/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'ACCEPTED' });
    req.flush(updatedResponse);
  });

  it('devrait supprimer une annonce via deleteAnnouncement() (US-RENF-05)', () => {
    repository.deleteAnnouncement(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/reinforcements/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
