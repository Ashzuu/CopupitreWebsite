import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PermanentRecruitmentsRepository } from './permanent-recruitments-repository';
import { environment } from '@environments/environment';
import { PermanentAnnouncement } from '@models/permanent-recruitment';
import { ReinforcementResponse } from '@models/reinforcement';

describe('PermanentRecruitmentsRepository', () => {
  let repository: PermanentRecruitmentsRepository;
  let httpMock: HttpTestingController;
  const baseUrl = environment.BASE_API_URL;

  const mockAnnouncements: PermanentAnnouncement[] = [
    {
      id: 1,
      organizationId: 10,
      organizationName: 'Harmonie de Lyon',
      organizationCity: 'Lyon',
      instrument: 'Trompette',
      requiredCount: 2,
      validatedCount: 0,
      description: 'Niveau 2nd cycle',
      status: 'OPEN',
      type: 'PERMANENT',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PermanentRecruitmentsRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    repository = TestBed.inject(PermanentRecruitmentsRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé avec succès', () => {
    expect(repository).toBeTruthy();
  });

  it('devrait récupérer toutes les annonces de musiciens permanents', () => {
    repository.getAll().subscribe((data) => {
      expect(data).toEqual(mockAnnouncements);
    });

    const req = httpMock.expectOne(`${baseUrl}/api/annual-needs/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAnnouncements);
  });

  it('devrait récupérer les annonces permanentes administrées par l\'utilisateur', () => {
    repository.getMyPermanentAnnouncements().subscribe((data) => {
      expect(data).toEqual(mockAnnouncements);
    });

    const req = httpMock.expectOne(`${baseUrl}/api/annual-needs/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAnnouncements);
  });

  it('devrait récupérer les candidatures de l\'utilisateur connecté', () => {
    const mockResponses: ReinforcementResponse[] = [
      {
        id: 100,
        announcementId: 1,
        announcementTitle: 'Trompette - Harmonie de Lyon',
        respondentUsername: 'john_doe',
        respondedAt: '2026-10-25T12:00:00Z',
        status: 'PENDING',
      },
    ];

    repository.getMyApplications().subscribe((data) => {
      expect(data).toEqual(mockResponses);
    });

    const req = httpMock.expectOne(`${baseUrl}/api/annual-needs/my-applications`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponses);
  });

  it('devrait postuler à une annonce permanente', () => {
    const mockResp: ReinforcementResponse = {
      id: 101,
      announcementId: 1,
      announcementTitle: 'Trompette',
      respondentUsername: 'john_doe',
      respondedAt: '2026-10-25T12:00:00Z',
      status: 'PENDING',
      message: 'Très motivé !',
    };

    repository.applyToAnnouncement(1, 'Très motivé !').subscribe((res) => {
      expect(res).toEqual(mockResp);
    });

    const req = httpMock.expectOne(`${baseUrl}/api/annual-needs/1/apply`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'Très motivé !' });
    req.flush(mockResp);
  });

  it('devrait mettre à jour le statut d\'une candidature permanente', () => {
    const mockResp: ReinforcementResponse = {
      id: 101,
      announcementId: 1,
      announcementTitle: 'Trompette',
      respondentUsername: 'john_doe',
      respondedAt: '2026-10-25T12:00:00Z',
      status: 'ACCEPTED',
    };

    repository.updateApplicationStatus(1, 101, 'ACCEPTED').subscribe((res) => {
      expect(res.status).toBe('ACCEPTED');
    });

    const req = httpMock.expectOne(`${baseUrl}/api/annual-needs/1/applications/101/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'ACCEPTED' });
    req.flush(mockResp);
  });
});
