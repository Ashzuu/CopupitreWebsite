import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ManageApplicationsModal, ManageAnnouncementItem } from './manage-applications-modal';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { NotifService } from '@services/notif-service';
import { ReinforcementResponse } from '@models/reinforcement';

describe('ManageApplicationsModal', () => {
  let component: ManageApplicationsModal;
  let fixture: ComponentFixture<ManageApplicationsModal>;

  const mockResponses: ReinforcementResponse[] = [
    {
      id: 1,
      announcementId: 10,
      announcementTitle: 'Trombone pour concert',
      respondentUsername: 'alex_tr',
      respondentFullName: 'Alex Trombone',
      respondentInstrument: 'Trombone ténor',
      respondentEmail: 'alex@example.com',
      respondedAt: '2026-10-20T10:00:00Z',
      status: 'PENDING',
      message: 'Disponible le jour J',
    },
    {
      id: 2,
      announcementId: 10,
      announcementTitle: 'Trombone pour concert',
      respondentUsername: 'claire_m',
      respondentFullName: 'Claire Musique',
      respondentInstrument: 'Trombone',
      respondentEmail: 'claire@example.com',
      respondedAt: '2026-10-21T10:00:00Z',
      status: 'ACCEPTED',
    },
    {
      id: 3,
      announcementId: 10,
      announcementTitle: 'Trombone pour concert',
      respondentUsername: 'paul_b',
      respondentFullName: 'Paul Bass',
      respondentInstrument: 'Trombone basse',
      respondentEmail: 'paul@example.com',
      respondedAt: '2026-10-19T10:00:00Z',
      status: 'REJECTED',
    },
  ];

  const mockAnnouncement: ManageAnnouncementItem = {
    id: 10,
    title: 'Trombone pour concert',
    instrumentNeeded: 'Trombone',
    organizationId: 1,
    organizationName: 'Harmonie de Lyon',
    status: 'OPEN',
    requiredCount: 2,
    validatedCount: 1,
    createdAt: '2026-10-01',
    deadline: '2026-11-01',
    eventDate: '2026-11-15',
    location: 'Lyon',
    description: 'Concert d\'automne',
    responses: [...mockResponses],
  };

  const mockRepo = {
    updateApplicationStatus: vi.fn().mockReturnValue(
      of({ ...mockResponses[0], status: 'ACCEPTED' })
    ),
  };

  const mockPermanentRepo = {
    updateApplicationStatus: vi.fn().mockReturnValue(
      of({ ...mockResponses[0], status: 'ACCEPTED' })
    ),
  };

  const mockNotifService = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(async () => {
    mockRepo.updateApplicationStatus.mockClear().mockReturnValue(
      of({ ...mockResponses[0], status: 'ACCEPTED' })
    );
    mockPermanentRepo.updateApplicationStatus.mockClear();
    mockNotifService.showSuccess.mockClear();
    mockNotifService.showError.mockClear();

    await TestBed.configureTestingModule({
      imports: [ManageApplicationsModal],
      providers: [
        { provide: ReinforcementsRepository, useValue: mockRepo },
        { provide: PermanentRecruitmentsRepository, useValue: mockPermanentRepo },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageApplicationsModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('announcement', {
      ...mockAnnouncement,
      responses: mockResponses.map((r) => ({ ...r })),
    });
    fixture.componentRef.setInput('announcementType', 'RENFORT');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait retourner toutes les réponses par défaut', () => {
    expect(component.getResponses().length).toBe(3);
  });

  it('devrait filtrer les candidatures par statut', () => {
    component.filter.set('PENDING');
    expect(component.getResponses().length).toBe(1);
    expect(component.getResponses()[0].id).toBe(1);

    component.filter.set('ACCEPTED');
    expect(component.getResponses().length).toBe(1);
    expect(component.getResponses()[0].id).toBe(2);

    component.filter.set('REJECTED');
    expect(component.getResponses().length).toBe(1);
    expect(component.getResponses()[0].id).toBe(3);
  });

  it('devrait calculer le nombre de candidatures par statut', () => {
    expect(component.getCountByStatus('PENDING')).toBe(1);
    expect(component.getCountByStatus('ACCEPTED')).toBe(1);
    expect(component.getCountByStatus('REJECTED')).toBe(1);
  });

  it('devrait accepter une candidature en attente et émettre statusUpdated', () => {
    const emitSpy = vi.spyOn(component.statusUpdated, 'emit');
    const targetResp = component.announcement().responses![0];

    component.updateApplicationStatus(targetResp, 'ACCEPTED');

    expect(mockRepo.updateApplicationStatus).toHaveBeenCalledWith(10, 1, 'ACCEPTED');
    expect(targetResp.status).toBe('ACCEPTED');
    expect(component.announcement().validatedCount).toBe(2);
    expect(component.announcement().status).toBe('OBJECTIVE_MET');
    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Candidature acceptée !');
    expect(emitSpy).toHaveBeenCalled();
  });

  it('devrait changer le statut d\'une candidature acceptée vers refusée', () => {
    const targetResp = component.announcement().responses![1]; // ACCEPTED
    mockRepo.updateApplicationStatus.mockReturnValue(of({ ...targetResp, status: 'REJECTED' }));

    component.updateApplicationStatus(targetResp, 'REJECTED');

    expect(mockRepo.updateApplicationStatus).toHaveBeenCalledWith(10, 2, 'REJECTED');
    expect(targetResp.status).toBe('REJECTED');
    expect(component.announcement().validatedCount).toBe(0);
    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Candidature refusée.');
  });

  it('devrait émettre closed lors de la fermeture', () => {
    const closeSpy = vi.spyOn(component.closed, 'emit');
    component.close();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('devrait fermer la modale sur la touche Escape', () => {
    const closeSpy = vi.spyOn(component.closed, 'emit');
    component.onEscape();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('devrait construire le lien mailto avec l\'email du candidat', () => {
    const mailto = component.getMailtoLink(mockResponses[0]);
    expect(mailto).toContain('mailto:alex@example.com');
    expect(mailto).toContain('subject=Votre%20candidature');
  });

  it('devrait gérer l\'erreur de mise à jour de statut', () => {
    mockRepo.updateApplicationStatus.mockReturnValue(
      throwError(() => ({ error: { message: 'Erreur mise à jour' } }))
    );
    const targetResp = component.announcement().responses![0];

    component.updateApplicationStatus(targetResp, 'ACCEPTED');

    expect(mockNotifService.showError).toHaveBeenCalledWith('Erreur mise à jour');
    expect(component.isUpdating(targetResp.id)).toBe(false);
  });
});
