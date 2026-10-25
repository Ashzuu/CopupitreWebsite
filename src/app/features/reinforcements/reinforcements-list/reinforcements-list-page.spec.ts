import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ReinforcementsListPage } from './reinforcements-list-page';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { ReinforcementAnnouncement, ReinforcementResponse } from '@models/reinforcement';

describe('ReinforcementsListPage', () => {
  let component: ReinforcementsListPage;
  let fixture: ComponentFixture<ReinforcementsListPage>;
  let mockRepo: any;
  let mockOrgRepo: any;
  let mockAuthService: any;
  let mockNotifService: any;

  const mockAnnouncements: ReinforcementAnnouncement[] = [
    {
      id: 1,
      organizationId: 10,
      title: 'Besoin Clarinette pour concert d\'automne',
      organizationName: 'Harmonie Municipale de Lyon',
      instrumentNeeded: 'Clarinette',
      eventDate: '2026-11-20T20:00:00Z',
      deadline: '2026-11-15T23:59:59Z',
      location: 'Lyon',
      description: 'Programme varié',
      requiredCount: 2,
      validatedCount: 1,
      status: 'OPEN',
      createdAt: '2026-10-01T10:00:00Z',
    },
    {
      id: 2,
      organizationId: 20,
      title: 'Trompette solo Brass Band',
      organizationName: 'Brass Band de Paris',
      instrumentNeeded: 'Trompette',
      eventDate: '2026-12-05T19:30:00Z',
      deadline: '2026-12-01T23:59:59Z',
      location: 'Paris',
      description: 'Niveau cycle 3',
      requiredCount: 1,
      validatedCount: 0,
      status: 'OPEN',
      createdAt: '2026-10-02T10:00:00Z',
    },
    {
      id: 3,
      organizationId: 30,
      title: 'Saxophone Alto Symphonie',
      organizationName: 'Orchestre de Lyon',
      instrumentNeeded: 'Saxophone',
      eventDate: '2026-12-15T20:00:00Z',
      deadline: '2026-12-10T23:59:59Z',
      location: 'Villeurbanne',
      description: 'Ravel Boléro',
      requiredCount: 1,
      validatedCount: 1,
      status: 'OBJECTIVE_MET',
      createdAt: '2026-10-03T10:00:00Z',
    },
  ];

  const mockApplications: ReinforcementResponse[] = [
    {
      id: 50,
      announcementId: 2,
      announcementTitle: 'Trompette solo',
      respondentUsername: 'musician1',
      respondedAt: '2026-10-05T10:00:00Z',
      status: 'PENDING',
    },
  ];

  beforeEach(async () => {
    mockRepo = {
      getAll: vi.fn().mockReturnValue(of(mockAnnouncements)),
      getMyApplications: vi.fn().mockReturnValue(of(mockApplications)),
      deleteAnnouncement: vi.fn().mockReturnValue(of(void 0)),
    };

    mockOrgRepo = {
      getUserOrganizations: vi.fn().mockReturnValue(
        of([
          {
            id: 10,
            name: 'Harmonie Municipale de Lyon',
            adminUsernames: ['admin1'],
            rehearsalSchedules: [],
          },
        ])
      ),
    };

    mockAuthService = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      currentUserFullName: vi.fn().mockReturnValue('Admin User'),
      currentUsername: vi.fn().mockReturnValue('admin1'),
    };

    mockNotifService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReinforcementsListPage],
      providers: [
        provideRouter([]),
        { provide: ReinforcementsRepository, useValue: mockRepo },
        { provide: OrganizationRepository, useValue: mockOrgRepo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReinforcementsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les annonces et les candidatures au démarrage', () => {
    expect(mockRepo.getAll).toHaveBeenCalled();
    expect(mockRepo.getMyApplications).toHaveBeenCalled();
    expect(component.announcements().length).toBe(3);
    expect(component.userApplications().length).toBe(1);
  });

  it('devrait identifier correctement les organisations administrées', () => {
    expect(component.adminOrgIds()).toContain(10);
    expect(component.hasAdminOrganization()).toBe(true);
  });

  it('devrait séparer les demandes publiques et mes demandes selon les organisations administrées', () => {
    // Org 10 est administrée par l'utilisateur connecté
    expect(component.myAnnouncements().length).toBe(1);
    expect(component.myAnnouncements()[0].id).toBe(1);

    // Orgs 20 et 30 sont publiques
    expect(component.publicAnnouncements().length).toBe(2);
    expect(component.publicAnnouncements().map((a) => a.id)).toEqual([2, 3]);
  });

  it('devrait basculer entre l\'onglet public et mes demandes via setTab()', () => {
    expect(component.activeTab()).toBe('public');
    expect(component.displayedAnnouncements().length).toBe(2);

    component.setTab('my');
    expect(component.activeTab()).toBe('my');
    expect(component.displayedAnnouncements().length).toBe(1);
    expect(component.displayedAnnouncements()[0].id).toBe(1);
  });

  it('devrait filtrer les annonces publiques par ville de façon insensible à la casse (RG-RENF-08)', () => {
    component.filterCity.set('paris');
    const filtered = component.displayedAnnouncements();
    expect(filtered.length).toBe(1);
    expect(filtered[0].location).toBe('Paris');
  });

  it('devrait filtrer les annonces publiques par organisation de façon insensible à la casse (RG-RENF-08)', () => {
    component.filterOrg.set('brass');
    const filtered = component.displayedAnnouncements();
    expect(filtered.length).toBe(1);
    expect(filtered[0].organizationName).toBe('Brass Band de Paris');
  });

  it('devrait filtrer les annonces publiques par instrument de façon insensible à la casse (RG-RENF-08)', () => {
    component.filterInstrument.set('trompette');
    const filtered = component.displayedAnnouncements();
    expect(filtered.length).toBe(1);
    expect(filtered[0].instrumentNeeded).toBe('Trompette');
  });

  it('devrait filtrer l\'onglet mes demandes lors d\'une recherche', () => {
    component.setTab('my');
    component.filterInstrument.set('clarinette');
    expect(component.displayedAnnouncements().length).toBe(1);

    component.filterInstrument.set('trompette');
    expect(component.displayedAnnouncements().length).toBe(0);
  });

  it('devrait mettre à jour la liste des candidatures lors de onApplicationApplied()', () => {
    const newApp: ReinforcementResponse = {
      id: 51,
      announcementId: 3,
      announcementTitle: 'Saxophone Alto',
      respondentUsername: 'musician1',
      respondedAt: '2026-10-06T10:00:00Z',
      status: 'PENDING',
    };

    component.onApplicationApplied(newApp);
    expect(component.userApplications().length).toBe(2);
    expect(component.userApplications().some((a) => a.announcementId === 3)).toBe(true);
  });

  it('devrait supprimer une annonce après confirmation (US-RENF-05)', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.onDeleteAnnouncement(1);
    expect(mockRepo.deleteAnnouncement).toHaveBeenCalledWith(1);
    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Annonce supprimée avec succès.');
  });
});
