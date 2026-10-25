import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { DashboardPage } from './dashboard-page';
import { DashboardService, OrgDashboardBlock } from './data/dashboard-service';
import { LoaderService } from '@services/loader-service';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';
import { AuthService } from '@services/auth-service';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { EquipmentRequest, Organization, ReinforcementAnnouncement, ReinforcementResponse } from '@models/index';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let dashboardServiceMock: any;
  let notifServiceMock: any;
  let reinforcementRepoMock: any;
  let authServiceMock: any;

  const mockOrg: Organization = {
    id: 1,
    name: 'Harmonie Municipale',
    city: 'Lyon',
    description: 'Orchestre',
    adminUsernames: ['testuser'],
    rehearsalSchedules: [
      { id: 10, dayOfWeek: 'TUESDAY', startTime: '20:00', endTime: '22:00', location: 'Salle A' },
    ],
    rehearsalManuals: [],
    annualNeeds: [],
    concerts: [],
  };

  const mockAnnouncements: ReinforcementAnnouncement[] = [
    {
      id: 101,
      organizationId: 1,
      title: 'Besoin Clarinette',
      organizationName: 'Harmonie Municipale',
      instrumentNeeded: 'Clarinette',
      eventDate: '2026-12-01',
      deadline: '2026-11-20',
      location: 'Lyon',
      description: 'Concert',
      requiredCount: 2,
      validatedCount: 0,
      status: 'OPEN',
      createdAt: '2026-10-01',
    },
  ];

  const mockEquipment: EquipmentRequest = {
    id: 201,
    organizationId: 1,
    organizationName: 'Harmonie Municipale',
    title: 'Besoins de pupitres',
    equipmentName: 'Pupitres pliants',
    duration: '1 week',
    eventDates: ['2026-12-01'],
    status: 'OPEN',
  };

  const mockBlock: OrgDashboardBlock = {
    organization: mockOrg,
    announcements: mockAnnouncements,
    equipmentRequests: [mockEquipment],
    permanentAnnouncements: [],
  };

  beforeEach(async () => {
    dashboardServiceMock = {
      isLoading: signal(false),
      error: signal<string | null>(null),
      organizations: signal([mockOrg]),
      allAnnouncements: signal([]),
      allEquipmentRequests: signal([]),
      numberOfReinforcements: signal(1),
      orgBlocks: signal([mockBlock]),
      loadDashboardData: vi.fn().mockReturnValue(Promise.resolve()),
      updateEquipmentStatus: vi.fn().mockReturnValue(of({ ...mockEquipment, status: 'MET' })),
      deleteEquipmentRequest: vi.fn().mockReturnValue(of(undefined)),
    };

    notifServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    reinforcementRepoMock = {
      getMyApplications: vi.fn().mockReturnValue(of([])),
    };

    authServiceMock = {
      isAuthenticated: signal(true),
      currentUsername: signal('testuser'),
      currentUserFullName: signal('Test User'),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardServiceMock },
        { provide: NotifService, useValue: notifServiceMock },
        { provide: ReinforcementsRepository, useValue: reinforcementRepoMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: LoggerService,
          useValue: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
        },
        {
          provide: LoaderService,
          useValue: { show: vi.fn(), hide: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler loadDashboardData et charger les candidatures au démarrage', () => {
    expect(dashboardServiceMock.loadDashboardData).toHaveBeenCalled();
    expect(reinforcementRepoMock.getMyApplications).toHaveBeenCalled();
  });

  it('devrait mettre à jour le statut du matériel et afficher une notification', () => {
    component.onEquipmentStatusChanged({ request: mockEquipment, status: 'MET' });
    expect(dashboardServiceMock.updateEquipmentStatus).toHaveBeenCalledWith(201, 'MET');
    expect(notifServiceMock.showSuccess).toHaveBeenCalledWith('Matériel marqué comme trouvé !');
  });

  it('devrait mettre à jour la liste des candidatures lors de onApplicationApplied', () => {
    const newApp: ReinforcementResponse = {
      id: 50,
      announcementId: 101,
      announcementTitle: 'Besoin Clarinette',
      respondentUsername: 'testuser',
      respondedAt: '2026-10-25T14:00:00Z',
      status: 'PENDING',
    };

    component.onApplicationApplied(newApp);
    expect(component.userApplications().length).toBe(1);
    expect(component.userApplications()[0].id).toBe(50);
  });
});
