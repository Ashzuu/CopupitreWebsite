import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AbsenceRepository } from './absence-repository';
import { Absence, AbsenceStats } from '../model';
import { environment } from '@environments/environment';

describe('AbsenceRepository', () => {
  let repository: AbsenceRepository;
  let httpMock: HttpTestingController;
  const baseUrl = environment.BASE_API_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AbsenceRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    repository = TestBed.inject(AbsenceRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should register an absence', () => {
    const mockAbsence: Absence = {
      id: 1,
      organizationId: 10,
      musicianId: 2,
      musicianFirstName: 'Paul',
      musicianLastName: 'Nérac',
      musicianEmail: 'paul@test.fr',
      instrument: 'Cor',
      eventType: 'REHEARSAL',
      eventDate: '2026-11-20',
      reason: 'Maladie',
      status: 'PENDING',
      submittedByAdmin: false,
      createdAt: '2026-11-12T10:00:00Z',
    };

    repository.registerAbsence(10, {
      musicianId: 2,
      eventType: 'REHEARSAL',
      eventDate: '2026-11-20',
      reason: 'Maladie',
    }).subscribe((res) => {
      expect(res.id).toBe(1);
      expect(res.status).toBe('PENDING');
    });

    const req = httpMock.expectOne(`${baseUrl}/api/organizations/10/absences`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAbsence);
  });

  it('should fetch filtered absences', () => {
    repository.getAbsences(10, { eventType: 'CONCERT', status: 'JUSTIFIED' }).subscribe((res) => {
      expect(res.length).toBe(0);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${baseUrl}/api/organizations/10/absences` &&
        r.params.get('eventType') === 'CONCERT' &&
        r.params.get('status') === 'JUSTIFIED',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should fetch stats', () => {
    const mockStats: AbsenceStats[] = [
      {
        musicianId: 2,
        musicianName: 'Paul Nérac',
        musicianEmail: 'paul@test.fr',
        instrument: 'Cor',
        totalAbsences: 3,
        justifiedCount: 2,
        unjustifiedCount: 1,
        pendingCount: 0,
      },
    ];

    repository.getStats(10, '2026-10-01', '2026-11-01').subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].totalAbsences).toBe(3);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${baseUrl}/api/organizations/10/absences/stats` &&
        r.params.get('startDate') === '2026-10-01' &&
        r.params.get('endDate') === '2026-11-01',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should update absence status', () => {
    const updated: Absence = {
      id: 5,
      organizationId: 10,
      musicianId: 2,
      musicianFirstName: 'Paul',
      musicianLastName: 'Nérac',
      musicianEmail: 'paul@test.fr',
      instrument: 'Cor',
      eventType: 'CONCERT',
      eventDate: '2026-12-01',
      reason: 'Motif',
      status: 'JUSTIFIED',
      submittedByAdmin: false,
      createdAt: '2026-11-12T10:00:00Z',
    };

    repository.updateStatus(10, 5, 'JUSTIFIED').subscribe((res) => {
      expect(res.status).toBe('JUSTIFIED');
    });

    const req = httpMock.expectOne(`${baseUrl}/api/organizations/10/absences/5/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'JUSTIFIED' });
    req.flush(updated);
  });

  it('should notify cancellation', () => {
    repository.notifyCancellation(10, {
      eventType: 'REHEARSAL',
      eventDate: '2026-11-20',
      message: 'Salle fermée',
    }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/api/organizations/10/absences/cancel-event`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
