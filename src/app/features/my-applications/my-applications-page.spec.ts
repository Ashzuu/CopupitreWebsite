import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MyApplicationsPage } from './my-applications-page';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { NotifService } from '@services/notif-service';
import { ReinforcementResponse } from '@models/reinforcement';

describe('MyApplicationsPage', () => {
  let component: MyApplicationsPage;
  let fixture: ComponentFixture<MyApplicationsPage>;

  const mockReinforcements: ReinforcementResponse[] = [
    {
      id: 1,
      announcementId: 101,
      announcementTitle: 'Trombone pour Requiem de Mozart',
      respondentUsername: 'trombonist',
      respondedAt: '2026-10-20T10:00:00Z',
      status: 'PENDING',
      message: 'Disponible le weekend',
      organizationId: 5,
      organizationName: 'Orchestre Symphonique',
      organizationEmail: 'contact@symphonique.org',
      type: 'RENFORT',
      eventLocation: 'Lyon',
    },
    {
      id: 2,
      announcementId: 102,
      announcementTitle: 'Tuba pour concert de printemps',
      respondentUsername: 'trombonist',
      respondedAt: '2026-10-15T10:00:00Z',
      status: 'ACCEPTED',
      organizationId: 6,
      organizationName: 'Harmonie de Paris',
      organizationEmail: 'contact@harmonieparis.fr',
      type: 'RENFORT',
      eventLocation: 'Paris',
    },
  ];

  const mockPermanents: ReinforcementResponse[] = [
    {
      id: 3,
      announcementId: 201,
      announcementTitle: 'Hautbois - Philharmonie',
      respondentUsername: 'trombonist',
      respondedAt: '2026-10-22T10:00:00Z',
      status: 'REJECTED',
      message: 'Grande motivation pour la saison',
      organizationId: 7,
      organizationName: 'Philharmonie',
      organizationEmail: 'admin@philharmonie.fr',
      type: 'PERMANENT',
      eventLocation: 'Marseille',
    },
  ];

  const mockReinforcementsRepo = {
    getMyApplications: vi.fn().mockReturnValue(of(mockReinforcements)),
  };

  const mockPermanentRepo = {
    getMyApplications: vi.fn().mockReturnValue(of(mockPermanents)),
  };

  const mockNotifService = {
    showError: vi.fn(),
    showSuccess: vi.fn(),
  };

  beforeEach(async () => {
    mockReinforcementsRepo.getMyApplications.mockClear().mockReturnValue(of(mockReinforcements));
    mockPermanentRepo.getMyApplications.mockClear().mockReturnValue(of(mockPermanents));
    mockNotifService.showError.mockClear();

    await TestBed.configureTestingModule({
      imports: [MyApplicationsPage],
      providers: [
        provideRouter([]),
        { provide: ReinforcementsRepository, useValue: mockReinforcementsRepo },
        { provide: PermanentRecruitmentsRepository, useValue: mockPermanentRepo },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyApplicationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les candidatures de renfort et permanentes', () => {
    expect(mockReinforcementsRepo.getMyApplications).toHaveBeenCalled();
    expect(mockPermanentRepo.getMyApplications).toHaveBeenCalled();
    expect(component.reinforcementApplications().length).toBe(2);
    expect(component.permanentApplications().length).toBe(1);
    expect(component.allApplications().length).toBe(3);
    expect(component.loading()).toBe(false);
  });

  it('devrait trier toutes les candidatures par date décroissante', () => {
    const all = component.allApplications();
    expect(all[0].id).toBe(3); // 2026-10-22
    expect(all[1].id).toBe(1); // 2026-10-20
    expect(all[2].id).toBe(2); // 2026-10-15
  });

  it('devrait filtrer les candidatures selon l\'onglet actif', () => {
    component.setTab('ALL');
    expect(component.filteredApplications().length).toBe(3);

    component.setTab('RENFORT');
    expect(component.filteredApplications().length).toBe(2);
    expect(component.filteredApplications().every((a) => a.type === 'RENFORT')).toBe(true);

    component.setTab('PERMANENT');
    expect(component.filteredApplications().length).toBe(1);
    expect(component.filteredApplications()[0].type === 'PERMANENT').toBe(true);
  });

  it('devrait traduire correctement les statuts de candidature', () => {
    expect(component.translateStatus('PENDING')).toBe('En attente');
    expect(component.translateStatus('ACCEPTED')).toBe('Acceptée');
    expect(component.translateStatus('REJECTED')).toBe('Refusée');
  });

  it('devrait construire le lien mailto correctement pour contacter l\'organisation', () => {
    const app = mockReinforcements[0];
    const mailto = component.getMailtoLink(app);
    expect(mailto).toContain('mailto:contact@symphonique.org');
    expect(mailto).toContain('subject=Candidature%20Copupitre');
  });

  it('devrait gérer l\'erreur de chargement gracieusement', () => {
    mockReinforcementsRepo.getMyApplications.mockReturnValue(throwError(() => new Error('Erreur réseau')));
    component.loadApplications();
    expect(mockNotifService.showError).toHaveBeenCalledWith('Impossible de charger vos candidatures.');
    expect(component.loading()).toBe(false);
  });
});
