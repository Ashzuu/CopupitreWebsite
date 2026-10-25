import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EquipmentRequestsListPage } from './equipment-requests-list-page';
import { EquipmentRepository } from '@repositories/equipment-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { EquipmentRequest, Organization } from '@models/index';

describe('EquipmentRequestsListPage', () => {
  let component: EquipmentRequestsListPage;
  let fixture: ComponentFixture<EquipmentRequestsListPage>;
  let mockEquipmentRepo: any;
  let mockOrgRepo: any;
  let mockAuthService: any;
  let mockNotifService: any;

  const mockRequests: EquipmentRequest[] = [
    {
      id: 1,
      title: 'Besoin de 4 timbales',
      equipmentName: 'Timbales',
      duration: '1 week-end',
      eventDates: ['2026-11-15', '2026-11-16'],
      organizationId: 10, // Admin org
      organizationName: 'Harmonie de Lyon',
      status: 'OPEN',
      description: 'Pour concert de gala',
    },
    {
      id: 2,
      title: 'Recherche marimba 4 octaves',
      equipmentName: 'Marimba',
      duration: '2 semaines',
      eventDates: ['2026-12-01'],
      organizationId: 20, // Public org
      organizationName: 'Symphonique Paris',
      status: 'MET',
      description: 'Pièce contemporaine',
    },
    {
      id: 3,
      title: 'Pupitres pliables',
      equipmentName: 'Pupitres',
      duration: '1 jour',
      eventDates: ['2026-11-20'],
      organizationId: 30, // Public org
      organizationName: 'Ensemble Cuivres',
      status: 'CLOSED',
      description: 'Prêt terminé',
    },
  ];

  const mockUserOrgs: Organization[] = [
    {
      id: 10,
      name: 'Harmonie de Lyon',
      city: 'Lyon',
      description: 'Orchestre associatif',
      adminUsernames: ['alice_admin'],
      rehearsalSchedules: [],
    },
  ];

  beforeEach(async () => {
    mockEquipmentRepo = {
      getAllRequests: vi.fn().mockReturnValue(of(mockRequests)),
      updateStatus: vi.fn().mockReturnValue(of({ ...mockRequests[0], status: 'MET' })),
      deleteRequest: vi.fn().mockReturnValue(of(undefined)),
    };

    mockOrgRepo = {
      getUserOrganizations: vi.fn().mockReturnValue(of(mockUserOrgs)),
    };

    mockAuthService = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      currentUsername: vi.fn().mockReturnValue('alice_admin'),
      currentUserFullName: vi.fn().mockReturnValue('Alice Admin'),
    };

    mockNotifService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentRequestsListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: EquipmentRepository, useValue: mockEquipmentRepo },
        { provide: OrganizationRepository, useValue: mockOrgRepo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentRequestsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les demandes et organisations au démarrage', () => {
    expect(mockEquipmentRepo.getAllRequests).toHaveBeenCalled();
    expect(mockOrgRepo.getUserOrganizations).toHaveBeenCalled();
    expect(component.allRequests().length).toBe(3);
  });

  it('devrait séparer les demandes publiques de mes demandes selon adminOrgIds', () => {
    // Org 10 est administrée par Alice
    // Demande 1 (orgId: 10) est dans myRequests et exclue de publicRequests
    expect(component.publicRequests().length).toBe(2);
    expect(component.publicRequests().map((r) => r.id)).toEqual([2, 3]);

    expect(component.myRequests().length).toBe(1);
    expect(component.myRequests()[0].id).toBe(1);
  });

  it('devrait basculer entre les onglets public et my', () => {
    expect(component.activeTab()).toBe('public');
    expect(component.displayedRequests().length).toBe(2);

    component.setTab('my');
    expect(component.activeTab()).toBe('my');
    expect(component.displayedRequests().length).toBe(1);
    expect(component.displayedRequests()[0].id).toBe(1);
  });

  it('devrait filtrer les demandes selon le terme de recherche textuel', () => {
    component.setTab('public');
    component.searchTerm.set('marimba');
    expect(component.displayedRequests().length).toBe(1);
    expect(component.displayedRequests()[0].equipmentName).toBe('Marimba');

    component.searchTerm.set('introuvable');
    expect(component.displayedRequests().length).toBe(0);

    component.resetFilters();
    expect(component.displayedRequests().length).toBe(2);
  });

  it('devrait filtrer les demandes selon le statut', () => {
    component.setTab('public');
    component.setStatusFilter('MET');
    expect(component.displayedRequests().length).toBe(1);
    expect(component.displayedRequests()[0].id).toBe(2);

    component.setStatusFilter('CLOSED');
    expect(component.displayedRequests().length).toBe(1);
    expect(component.displayedRequests()[0].id).toBe(3);

    component.setStatusFilter('ALL');
    expect(component.displayedRequests().length).toBe(2);
  });

  it('devrait formater correctement les dates d\'événements', () => {
    expect(component.formatEventDates([])).toBe('Dates non spécifiées / Flexibles');
    expect(component.formatEventDates(['2026-11-15', '2026-11-16'])).toBe('15/11/2026, 16/11/2026');
  });

  it('devrait mettre à jour le statut d\'une demande par un admin', () => {
    const adminReq = mockRequests[0]; // orgId: 10
    component.updateStatus(adminReq, 'MET');

    expect(mockEquipmentRepo.updateStatus).toHaveBeenCalledWith(1, 'MET');
    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Matériel marqué comme trouvé !');
  });

  it('devrait supprimer une demande de matériel après confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const adminReq = mockRequests[0];

    component.deleteRequest(adminReq);

    expect(mockEquipmentRepo.deleteRequest).toHaveBeenCalledWith(1);
    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Demande de matériel supprimée avec succès.');
    expect(component.allRequests().find((r) => r.id === 1)).toBeUndefined();
  });

  it('ne devrait pas supprimer si l\'utilisateur annule la confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const adminReq = mockRequests[0];

    component.deleteRequest(adminReq);

    expect(mockEquipmentRepo.deleteRequest).not.toHaveBeenCalled();
  });
});
