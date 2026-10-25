import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DashboardService } from './dashboard-service';
import { DashboardRepository } from './dashboard-repository';
import { LoggerService } from '@services/logger-service';
import { Organization, ReinforcementAnnouncement, EquipmentRequest } from '@models/index';

describe('DashboardService', () => {
  let service: DashboardService;
  let repoMock: any;
  let loggerMock: any;

  const mockOrgs: Organization[] = [
    {
      id: 1,
      name: 'Harmonie Municipale',
      city: 'Lyon',
      description: 'Orchestre d\'harmonie',
      adminUsernames: ['testuser'],
      rehearsalSchedules: [],
      rehearsalManuals: [],
      annualNeeds: [],
      concerts: [],
    },
  ];

  const mockAllAnnouncements: ReinforcementAnnouncement[] = [
    {
      id: 10,
      organizationId: 1, // Owned org -> excluded from public list
      title: 'Besoin Trompette',
      organizationName: 'Harmonie Municipale',
      instrumentNeeded: 'Trompette',
      eventDate: '2026-11-20',
      deadline: '2026-11-15',
      location: 'Lyon',
      description: 'Concert',
      requiredCount: 2,
      validatedCount: 1,
      status: 'OPEN',
      createdAt: '2026-10-01',
    },
    {
      id: 20,
      organizationId: 2, // External org -> included in public list
      title: 'Besoin Hautbois',
      organizationName: 'Orchestre Philharmonique',
      instrumentNeeded: 'Hautbois',
      eventDate: '2026-11-25',
      deadline: '2026-11-20',
      location: 'Paris',
      description: 'Gala',
      requiredCount: 1,
      validatedCount: 0,
      status: 'OPEN',
      createdAt: '2026-10-02',
    },
  ];

  const mockAllEquipment: EquipmentRequest[] = [
    {
      id: 100,
      organizationId: 1,
      organizationName: 'Harmonie Municipale',
      title: 'Pupitres',
      equipmentName: 'Pupitres',
      duration: '3 jours',
      eventDates: ['2026-11-20'],
      status: 'OPEN',
    },
    {
      id: 200,
      organizationId: 2,
      organizationName: 'Orchestre Philharmonique',
      title: 'Timbales',
      equipmentName: 'Timbales',
      duration: '1 semaine',
      eventDates: ['2026-11-25'],
      status: 'OPEN',
    },
  ];

  beforeEach(() => {
    repoMock = {
      getUserOrganizations: vi.fn().mockReturnValue(of(mockOrgs)),
      getAllReinforcementAnnouncements: vi.fn().mockReturnValue(of(mockAllAnnouncements)),
      getAllEquipmentRequests: vi.fn().mockReturnValue(of(mockAllEquipment)),
      getMyPermanentAnnouncements: vi.fn().mockReturnValue(of([])),
      getOrganizationReinforcements: vi.fn().mockReturnValue(of([mockAllAnnouncements[0]])),
      getOrganizationEquipmentRequests: vi.fn().mockReturnValue(of([mockAllEquipment[0]])),
      getResponsesForAnnouncement: vi.fn().mockReturnValue(of([])),
      updateEquipmentStatus: vi.fn(),
      deleteEquipmentRequest: vi.fn(),
    };

    loggerMock = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: DashboardRepository, useValue: repoMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(DashboardService);
  });

  it('devrait être initialisé avec les valeurs par défaut', () => {
    expect(service).toBeTruthy();
    expect(service.organizations()).toEqual([]);
    expect(service.allAnnouncements()).toEqual([]);
    expect(service.allEquipmentRequests()).toEqual([]);
    expect(service.numberOfReinforcements()).toBe(0);
    expect(service.isLoading()).toBe(false);
  });

  it('devrait charger les données et filtrer les annonces des organisations administrées', async () => {
    await service.loadDashboardData();

    expect(service.organizations().length).toBe(1);
    expect(service.allAnnouncements().length).toBe(1);
    expect(service.allAnnouncements()[0].id).toBe(20);
    expect(service.allEquipmentRequests().length).toBe(1);
    expect(service.allEquipmentRequests()[0].id).toBe(200);

    // KPI computed
    expect(service.numberOfReinforcements()).toBe(1);
    expect(service.orgBlocks().length).toBe(1);
    expect(service.orgBlocks()[0].organization.name).toBe('Harmonie Municipale');
    expect(service.isLoading()).toBe(false);
  });

  it('devrait gérer les erreurs et logger via LoggerService', async () => {
    repoMock.getUserOrganizations.mockReturnValue(throwError(() => new Error('Erreur API')));

    await service.loadDashboardData();

    expect(service.error()).toBe('Une erreur est survenue lors du chargement des données.');
    expect(loggerMock.error).toHaveBeenCalled();
    expect(service.isLoading()).toBe(false);
  });

  it('devrait déléguer la mise à jour de statut du matériel', () => {
    const updated: EquipmentRequest = { ...mockAllEquipment[0], status: 'MET' };
    repoMock.updateEquipmentStatus.mockReturnValue(of(updated));

    service.updateEquipmentStatus(100, 'MET').subscribe((res) => {
      expect(res.status).toBe('MET');
      expect(repoMock.updateEquipmentStatus).toHaveBeenCalledWith(100, 'MET');
    });
  });

  it('devrait déléguer la suppression de demande de matériel', () => {
    repoMock.deleteEquipmentRequest.mockReturnValue(of(undefined));

    service.deleteEquipmentRequest(100).subscribe(() => {
      expect(repoMock.deleteEquipmentRequest).toHaveBeenCalledWith(100);
    });
  });
});
