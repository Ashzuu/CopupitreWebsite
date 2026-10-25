import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PermanentRecruitmentsListPage } from './permanent-recruitments-list-page';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { PermanentAnnouncement } from '@models/permanent-recruitment';
import { ReinforcementResponse } from '@models/reinforcement';
import { Organization } from '@models/organization';

describe('PermanentRecruitmentsListPage', () => {
  let component: PermanentRecruitmentsListPage;
  let fixture: ComponentFixture<PermanentRecruitmentsListPage>;
  let mockPermanentRepo: any;
  let mockOrgRepo: any;
  let mockAuthService: any;
  let mockNotifService: any;

  const mockAnnouncements: PermanentAnnouncement[] = [
    {
      id: 1,
      organizationId: 10,
      organizationName: 'Harmonie de Lyon',
      organizationCity: 'Lyon',
      formationType: 'Harmonie',
      musicianCount: 45,
      instrument: 'Trompette',
      requiredCount: 2,
      validatedCount: 0,
      description: 'Bon niveau en lecture',
      status: 'OPEN',
      type: 'PERMANENT',
    },
    {
      id: 2,
      organizationId: 20,
      organizationName: 'Symphonique Paris',
      organizationCity: 'Paris',
      formationType: 'Symphonique',
      musicianCount: 70,
      instrument: 'Hautbois',
      requiredCount: 1,
      validatedCount: 0,
      description: 'Expérience requise',
      status: 'OPEN',
      type: 'PERMANENT',
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
    mockPermanentRepo = {
      getAll: vi.fn().mockReturnValue(of(mockAnnouncements)),
      getMyApplications: vi.fn().mockReturnValue(of([])),
      applyToAnnouncement: vi.fn(),
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
      imports: [PermanentRecruitmentsListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PermanentRecruitmentsRepository, useValue: mockPermanentRepo },
        { provide: ReinforcementsRepository, useValue: { updateApplicationStatus: vi.fn() } },
        { provide: OrganizationRepository, useValue: mockOrgRepo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PermanentRecruitmentsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les annonces et organisations au démarrage', () => {
    expect(mockPermanentRepo.getAll).toHaveBeenCalled();
    expect(mockOrgRepo.getUserOrganizations).toHaveBeenCalled();
    expect(mockPermanentRepo.getMyApplications).toHaveBeenCalled();
    expect(component.announcements().length).toBe(2);
  });

  it('devrait séparer les annonces publiques de mes annonces selon adminOrgIds', () => {
    // Org 10 est administrée par Alice (id: 10)
    // L'annonce 1 (orgId: 10) est dans myAnnouncements, et exclue de publicAnnouncements
    expect(component.publicAnnouncements().length).toBe(1);
    expect(component.publicAnnouncements()[0].id).toBe(2);

    expect(component.myAnnouncements().length).toBe(1);
    expect(component.myAnnouncements()[0].id).toBe(1);
  });

  it('devrait basculer entre les onglets public et my', () => {
    expect(component.activeTab()).toBe('public');
    expect(component.displayedAnnouncements().length).toBe(1);
    expect(component.displayedAnnouncements()[0].id).toBe(2);

    component.setTab('my');
    expect(component.activeTab()).toBe('my');
    expect(component.displayedAnnouncements().length).toBe(1);
    expect(component.displayedAnnouncements()[0].id).toBe(1);
  });

  it('devrait filtrer les annonces par instrument, ville et organisation', () => {
    component.setTab('public');
    component.filterInstrument.set('hautbois');
    expect(component.displayedAnnouncements().length).toBe(1);

    component.filterCity.set('lyon'); // Paris dans le mock
    expect(component.displayedAnnouncements().length).toBe(0);

    component.resetFilters();
    expect(component.displayedAnnouncements().length).toBe(1);
  });

  it('ne devrait pas permettre à un admin de postuler à son propre orchestre', () => {
    const adminAnnouncement = mockAnnouncements[0]; // orgId: 10
    expect(component.canApply(adminAnnouncement)).toBe(false);
    expect(component.isAdminOfOrg(adminAnnouncement)).toBe(true);
  });

  it('devrait ouvrir la modal et postuler avec succès à un poste permanent', () => {
    const publicAnnouncement = mockAnnouncements[1]; // orgId: 20
    const newApp: ReinforcementResponse = {
      id: 99,
      announcementId: 2,
      announcementTitle: 'Hautbois - Symphonique Paris',
      respondentUsername: 'alice_admin',
      respondedAt: '2026-10-25T13:00:00Z',
      status: 'PENDING',
      message: 'Très intéressée par ce pupitre',
    };
    mockPermanentRepo.applyToAnnouncement.mockReturnValue(of(newApp));

    component.openApplyModal(publicAnnouncement);
    expect(component.selectedAnnouncement()).toEqual(publicAnnouncement);

    component.applicationMessage.set('Très intéressée par ce pupitre');
    component.submitApplication();

    expect(mockPermanentRepo.applyToAnnouncement).toHaveBeenCalledWith(2, 'Très intéressée par ce pupitre');
    expect(mockNotifService.showSuccess).toHaveBeenCalled();
    expect(component.hasApplied(2)).toBe(true);
    expect(component.selectedAnnouncement()).toBeNull();
  });

  it('devrait afficher une erreur si la candidature échoue', () => {
    const publicAnnouncement = mockAnnouncements[1];
    mockPermanentRepo.applyToAnnouncement.mockReturnValue(
      throwError(() => ({ error: { message: 'Déjà postulé' } }))
    );

    component.openApplyModal(publicAnnouncement);
    component.submitApplication();

    expect(mockNotifService.showError).toHaveBeenCalledWith('Déjà postulé');
    expect(component.isSubmitting()).toBe(false);
  });

  it('devrait ouvrir et fermer la modale de gestion des candidatures permanentes', () => {
    expect(component.selectedManageAnnouncement()).toBeNull();
    component.openManageModal(mockAnnouncements[0]);
    expect(component.selectedManageAnnouncement()).toEqual(mockAnnouncements[0]);

    component.closeManageModal();
    expect(component.selectedManageAnnouncement()).toBeNull();
  });
});
