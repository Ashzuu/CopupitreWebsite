import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ReinforcementList } from './reinforcement-list';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { ReinforcementAnnouncement, ReinforcementResponse } from '@models/reinforcement';

describe('ReinforcementList', () => {
  let component: ReinforcementList;
  let fixture: ComponentFixture<ReinforcementList>;
  let mockRepo: any;
  let mockAuthService: any;
  let mockNotifService: any;

  const mockAnnouncementOpen: ReinforcementAnnouncement = {
    id: 1,
    organizationId: 10,
    title: 'Besoin Flûte',
    organizationName: 'Harmonie Test',
    instrumentNeeded: 'Flûte',
    eventDate: '2026-11-20T20:00:00Z',
    deadline: '2026-11-15T23:59:59Z',
    location: 'Lyon',
    description: 'Concert automne',
    requiredCount: 2,
    validatedCount: 0,
    status: 'OPEN',
    createdAt: '2026-10-01T10:00:00Z',
  };

  const mockAnnouncementMet: ReinforcementAnnouncement = {
    id: 2,
    organizationId: 20,
    title: 'Besoin Hautbois',
    organizationName: 'Orchestre 2',
    instrumentNeeded: 'Hautbois',
    eventDate: '2026-12-01T20:00:00Z',
    deadline: '2026-11-25T23:59:59Z',
    location: 'Paris',
    description: 'Complet',
    requiredCount: 1,
    validatedCount: 1,
    status: 'OBJECTIVE_MET',
    createdAt: '2026-10-01T10:00:00Z',
  };

  const mockUserApp: ReinforcementResponse = {
    id: 100,
    announcementId: 2,
    announcementTitle: 'Besoin Hautbois',
    respondentUsername: 'musician1',
    respondedAt: '2026-10-02T10:00:00Z',
    status: 'PENDING',
  };

  beforeEach(async () => {
    mockRepo = {
      applyToAnnouncement: vi.fn(),
    };

    mockAuthService = {
      isAuthenticated: vi.fn().mockReturnValue(true),
    };

    mockNotifService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReinforcementList],
      providers: [
        provideRouter([]),
        { provide: ReinforcementsRepository, useValue: mockRepo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReinforcementList);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('announcements', [mockAnnouncementOpen, mockAnnouncementMet]);
    fixture.componentRef.setInput('adminOrgIds', [10]);
    fixture.componentRef.setInput('userApplications', [mockUserApp]);
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait autoriser la suppression uniquement pour l\'administrateur de l\'organisation (RG-RENF-06)', () => {
    expect(component.canDelete(mockAnnouncementOpen)).toBe(true);
    expect(component.canDelete(mockAnnouncementMet)).toBe(false);
  });

  it('devrait détecter si l\'utilisateur a déjà postulé à une annonce (RG-RENF-05)', () => {
    expect(component.hasApplied(1)).toBe(false);
    expect(component.hasApplied(2)).toBe(true);
    expect(component.getUserApplication(2)).toEqual(mockUserApp);
  });

  it('devrait autoriser la candidature uniquement pour une annonce ouverte non administrée et non postulée', () => {
    // mockAnnouncementOpen est administrée par l'org 10 -> cannot apply
    expect(component.canApply(mockAnnouncementOpen)).toBe(false);

    // Annonce d'une autre org mais déjà postulée ou OBJECTIVE_MET
    expect(component.canApply(mockAnnouncementMet)).toBe(false);

    // Nouvelle annonce tierce ouverte
    const thirdAnnouncement: ReinforcementAnnouncement = {
      ...mockAnnouncementOpen,
      id: 3,
      organizationId: 99,
    };
    expect(component.canApply(thirdAnnouncement)).toBe(true);
  });

  it('devrait ouvrir et fermer la modal de candidature (RG-RENF-10)', () => {
    const thirdAnnouncement: ReinforcementAnnouncement = {
      ...mockAnnouncementOpen,
      id: 3,
      organizationId: 99,
    };

    component.openApplyModal(thirdAnnouncement);
    expect(component.selectedAnnouncement()).toEqual(thirdAnnouncement);

    component.closeApplyModal();
    expect(component.selectedAnnouncement()).toBeNull();
  });

  it('devrait soumettre la candidature avec message et émettre l\'événement (US-RENF-03 / RG-RENF-10)', () => {
    const thirdAnnouncement: ReinforcementAnnouncement = {
      ...mockAnnouncementOpen,
      id: 3,
      organizationId: 99,
    };
    const createdResponse: ReinforcementResponse = {
      id: 101,
      announcementId: 3,
      announcementTitle: thirdAnnouncement.title,
      respondentUsername: 'musician1',
      respondedAt: '2026-10-06T12:00:00Z',
      status: 'PENDING',
      message: 'Je suis très intéressé',
    };

    mockRepo.applyToAnnouncement.mockReturnValue(of(createdResponse));
    const emitSpy = vi.spyOn(component.applicationApplied, 'emit');

    component.openApplyModal(thirdAnnouncement);
    component.applicationMessage.set('Je suis très intéressé');
    component.submitApplication();

    expect(mockRepo.applyToAnnouncement).toHaveBeenCalledWith(3, 'Je suis très intéressé');
    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Votre candidature a été envoyée avec succès.');
    expect(emitSpy).toHaveBeenCalledWith(createdResponse);
    expect(component.selectedAnnouncement()).toBeNull();
  });

  it('devrait refuser la soumission si l\'utilisateur tente de postuler à sa propre organisation', () => {
    component.openApplyModal(mockAnnouncementOpen); // orgId 10, in adminOrgIds [10]
    component.submitApplication();

    expect(mockRepo.applyToAnnouncement).not.toHaveBeenCalled();
    expect(mockNotifService.showError).toHaveBeenCalledWith('Les administrateurs ne peuvent pas postuler aux annonces de leurs organisations.');
  });

  it('devrait gérer l\'erreur lors de la soumission de candidature', () => {
    const thirdAnnouncement: ReinforcementAnnouncement = {
      ...mockAnnouncementOpen,
      id: 3,
      organizationId: 99,
    };

    mockRepo.applyToAnnouncement.mockReturnValue(throwError(() => ({ error: { message: 'Déjà postulé' } })));

    component.openApplyModal(thirdAnnouncement);
    component.submitApplication();

    expect(mockNotifService.showError).toHaveBeenCalledWith('Déjà postulé');
    expect(component.isSubmitting()).toBe(false);
  });
});
