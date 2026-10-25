import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MyAnnouncementsPanel } from './my-announcements-panel';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { NotifService } from '@services/notif-service';
import { ReinforcementAnnouncement, ReinforcementResponse } from '@models/reinforcement';
import { PermanentAnnouncement } from '@models/permanent-recruitment';

describe('MyAnnouncementsPanel', () => {
  let component: MyAnnouncementsPanel;
  let fixture: ComponentFixture<MyAnnouncementsPanel>;
  let mockRepo: any;
  let mockPermanentRepo: any;
  let mockNotifService: any;

  const mockResponse: ReinforcementResponse = {
    id: 10,
    announcementId: 1,
    announcementTitle: 'Besoin Clarinette',
    respondentUsername: 'candidat1',
    respondentFullName: 'Sophie Martin',
    respondentInstrument: 'Clarinette',
    respondedAt: '2026-10-05T14:30:00Z',
    status: 'PENDING',
    message: 'Disponible tous les soirs de répétition',
  };

  const mockAnnouncement: ReinforcementAnnouncement = {
    id: 1,
    organizationId: 100,
    title: 'Besoin Clarinette',
    organizationName: 'Harmonie Test',
    instrumentNeeded: 'Clarinette',
    eventDate: '2026-11-20T20:00:00Z',
    deadline: '2026-11-15T23:59:59Z',
    location: 'Lyon',
    description: 'Programme automne',
    requiredCount: 1,
    validatedCount: 0,
    status: 'OPEN',
    createdAt: '2026-10-01T10:00:00Z',
    responses: [mockResponse],
  };

  const mockPermanentAnnouncement: PermanentAnnouncement = {
    id: 5,
    organizationId: 100,
    organizationName: 'Harmonie Test',
    instrument: 'Trompette',
    requiredCount: 2,
    validatedCount: 0,
    status: 'OPEN',
    type: 'PERMANENT',
    responses: [mockResponse],
  };

  beforeEach(async () => {
    mockRepo = {
      updateApplicationStatus: vi.fn(),
    };

    mockPermanentRepo = {
      updateApplicationStatus: vi.fn(),
    };

    mockNotifService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MyAnnouncementsPanel],
      providers: [
        { provide: ReinforcementsRepository, useValue: mockRepo },
        { provide: PermanentRecruitmentsRepository, useValue: mockPermanentRepo },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyAnnouncementsPanel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('announcements', [mockAnnouncement]);
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser les annonces locales à partir de l\'input', () => {
    expect(component.localAnnouncements().length).toBe(1);
    expect(component.localAnnouncements()[0].title).toBe('Besoin Clarinette');
    expect(component.localAnnouncements()[0].responses?.length).toBe(1);
  });

  it('devrait accepter une candidature et mettre à jour le quota et le statut', () => {
    const updatedResp: ReinforcementResponse = { ...mockResponse, status: 'ACCEPTED' };
    mockRepo.updateApplicationStatus.mockReturnValue(of(updatedResp));
    const statusEmitSpy = vi.spyOn(component.statusUpdated, 'emit');

    const announcement = component.localAnnouncements()[0];
    const resp = announcement.responses![0];

    component.updateApplicationStatus(announcement, resp, 'ACCEPTED');

    expect(mockRepo.updateApplicationStatus).toHaveBeenCalledWith(1, 10, 'ACCEPTED');
    expect(resp.status).toBe('ACCEPTED');
    expect(announcement.validatedCount).toBe(1);
    expect(announcement.status).toBe('OBJECTIVE_MET');
    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Candidature acceptée !');
    expect(statusEmitSpy).toHaveBeenCalledWith({ announcementId: 1, response: updatedResp });
  });

  it('devrait appeler PermanentRecruitmentsRepository quand le type est PERMANENT', () => {
    fixture.componentRef.setInput('announcementType', 'PERMANENT');
    fixture.componentRef.setInput('announcements', [mockPermanentAnnouncement]);
    fixture.detectChanges();

    const updatedResp: ReinforcementResponse = { ...mockResponse, status: 'ACCEPTED' };
    mockPermanentRepo.updateApplicationStatus.mockReturnValue(of(updatedResp));

    const announcement = component.localAnnouncements()[0];
    const resp = announcement.responses![0];

    component.updateApplicationStatus(announcement, resp, 'ACCEPTED');

    expect(mockPermanentRepo.updateApplicationStatus).toHaveBeenCalledWith(5, 10, 'ACCEPTED');
    expect(mockRepo.updateApplicationStatus).not.toHaveBeenCalled();
    expect(resp.status).toBe('ACCEPTED');
  });

  it('devrait refuser une candidature', () => {
    const updatedResp: ReinforcementResponse = { ...mockResponse, status: 'REJECTED' };
    mockRepo.updateApplicationStatus.mockReturnValue(of(updatedResp));

    const announcement = component.localAnnouncements()[0];
    const resp = announcement.responses![0];

    component.updateApplicationStatus(announcement, resp, 'REJECTED');

    expect(mockRepo.updateApplicationStatus).toHaveBeenCalledWith(1, 10, 'REJECTED');
    expect(resp.status).toBe('REJECTED');
    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Candidature refusée.');
  });

  it('devrait afficher une notification d\'erreur en cas d\'échec de mise à jour', () => {
    mockRepo.updateApplicationStatus.mockReturnValue(
      throwError(() => ({ error: { message: 'Erreur réseau' } }))
    );

    const announcement = component.localAnnouncements()[0];
    const resp = announcement.responses![0];

    component.updateApplicationStatus(announcement, resp, 'ACCEPTED');

    expect(mockNotifService.showError).toHaveBeenCalledWith('Erreur réseau');
  });

  it('devrait générer un lien mailto pour contacter le candidat', () => {
    const announcement = component.localAnnouncements()[0];
    const resp = { ...mockResponse, respondentEmail: 'sophie@music.fr' };
    const link = component.getMailtoLink(announcement, resp);
    expect(link).toContain('mailto:sophie@music.fr');
    expect(link).toContain('subject=Votre%20candidature');
  });
});
