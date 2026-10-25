import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EquipmentRepository } from './equipment-repository';
import { EquipmentRequest } from '../model';

describe('EquipmentRepository', () => {
  let repository: EquipmentRepository;
  let httpMock: HttpTestingController;

  const mockRequests: EquipmentRequest[] = [
    {
      id: 1,
      title: 'Prêt de timbales',
      equipmentName: 'Jeu de 4 timbales',
      duration: '1 week-end',
      eventDates: ['2026-11-15', '2026-11-16'],
      organizationId: 10,
      organizationName: 'Harmonie de Lyon',
      status: 'OPEN',
      description: 'Transport assuré par nos soins',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EquipmentRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    repository = TestBed.inject(EquipmentRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait récupérer toutes les demandes d\'équipement', () => {
    repository.getAllRequests().subscribe((data) => {
      expect(data).toEqual(mockRequests);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/equipments/requests/all'));
    expect(req.request.method).toBe('GET');
    req.flush(mockRequests);
  });

  it('devrait récupérer mes demandes de matériel', () => {
    repository.getMyEquipmentRequests().subscribe((data) => {
      expect(data).toEqual(mockRequests);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/equipments/me'));
    expect(req.request.method).toBe('GET');
    req.flush(mockRequests);
  });

  it('devrait enregistrer une demande de matériel', () => {
    const newReq: Partial<EquipmentRequest> = {
      title: 'Prêt de pupitres',
      equipmentName: '20 pupitres',
      duration: '1 jour',
      organizationId: 10,
    };

    repository.saveRequest(newReq).subscribe((data) => {
      expect(data.id).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/equipments/save'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newReq);
    req.flush({ ...newReq, id: 1, status: 'OPEN' });
  });

  it('devrait mettre à jour le statut d\'une demande', () => {
    repository.updateStatus(1, 'MET').subscribe((data) => {
      expect(data.status).toBe('MET');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/equipments/1/status'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'MET' });
    req.flush({ ...mockRequests[0], status: 'MET' });
  });

  it('devrait supprimer une demande de matériel', () => {
    repository.deleteRequest(1).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/equipments/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
