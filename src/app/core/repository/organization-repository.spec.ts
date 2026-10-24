import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrganizationRepository } from './organization-repository';
import { Organization } from '../model';
import { environment } from '@environments/environment';

describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;
  let httpTestingController: HttpTestingController;
  const baseUrl = environment.BASE_API_URL;

  const mockOrg: Organization = {
    id: 10,
    name: 'Orchestre Test',
    city: 'Lyon',
    musicianCount: 40,
    description: 'Description',
    adminUsernames: ['admin1'],
    rehearsalSchedules: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrganizationRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    repository = TestBed.inject(OrganizationRepository);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('devrait être initialisé', () => {
    expect(repository).toBeTruthy();
  });

  it('devrait ajouter un administrateur via addAdmin() (US-ORG-08)', () => {
    const updatedOrg = { ...mockOrg, adminUsernames: ['admin1', 'admin2'] };

    repository.addAdmin(10, 'admin2').subscribe((org) => {
      expect(org).toEqual(updatedOrg);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/organizations/10/admins`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin2' });

    req.flush(updatedOrg);
  });

  it('devrait retirer un administrateur via removeAdmin() (US-ORG-08)', () => {
    const updatedOrg = { ...mockOrg, adminUsernames: ['admin1'] };

    repository.removeAdmin(10, 'admin2').subscribe((org) => {
      expect(org).toEqual(updatedOrg);
    });

    const req = httpTestingController.expectOne(`${baseUrl}/api/organizations/10/admins/admin2`);
    expect(req.request.method).toBe('DELETE');

    req.flush(updatedOrg);
  });
});
