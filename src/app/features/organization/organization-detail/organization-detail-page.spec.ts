import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { OrganizationDetailPage } from './organization-detail-page';
import { AuthService } from '@services/auth-service';
import { OrganizationRepository } from '@repositories/organization-repository';
import { NotifService } from '@services/notif-service';
import { Organization } from '@models/organization';

describe('OrganizationDetailPage', () => {
  let component: OrganizationDetailPage;
  let fixture: ComponentFixture<OrganizationDetailPage>;
  let orgRepo: OrganizationRepository;
  let notifService: NotifService;

  const currentUsernameSignal = signal<string | null>('alice_master');
  const currentUserFullNameSignal = signal<string>('Alice Dupont');

  const mockAuthService = {
    currentUsername: currentUsernameSignal,
    currentUserFullName: currentUserFullNameSignal,
    isAuthenticated: signal(true),
    currentUserProfile: signal(null),
  };

  const mockOrg: Organization = {
    id: 42,
    name: 'Brass Band des Alpes',
    city: 'Chambéry',
    musicianCount: 30,
    description: 'Ensemble de cuivres traditionnel.',
    adminUsernames: ['alice_master', 'Jean Martin'],
    rehearsalSchedules: [],
    annualNeeds: [
      {
        id: 1,
        instrument: 'Cornet',
        count: 2,
        requiredCount: 2,
        description: 'Cornet solo ou soprano',
      },
    ],
    concerts: [],
  };

  beforeEach(async () => {
    currentUsernameSignal.set('alice_master');
    currentUserFullNameSignal.set('Alice Dupont');

    await TestBed.configureTestingModule({
      imports: [OrganizationDetailPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    orgRepo = TestBed.inject(OrganizationRepository);
    notifService = TestBed.inject(NotifService);

    fixture = TestBed.createComponent(OrganizationDetailPage);
    component = fixture.componentInstance;
    component.service.organization.set({ ...mockOrg, adminUsernames: [...mockOrg.adminUsernames] });
    await fixture.whenStable();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  describe('Calcul de isAdmin (US-ORG-08)', () => {
    it('devrait reconnaître un admin via son username (currentUsername)', () => {
      currentUsernameSignal.set('alice_master');
      currentUserFullNameSignal.set('Inconnu');

      expect(component.isAdmin()).toBe(true);
    });

    it('devrait reconnaître un admin via son nom complet (currentUserFullName)', () => {
      currentUsernameSignal.set('autre_pseudo');
      currentUserFullNameSignal.set('Jean Martin');

      expect(component.isAdmin()).toBe(true);
    });

    it('devrait refuser les privilèges admin si l\'utilisateur n\'est pas dans adminUsernames', () => {
      currentUsernameSignal.set('visiteur123');
      currentUserFullNameSignal.set('Visiteur Lambda');

      expect(component.isAdmin()).toBe(false);
    });

    it('devrait vérifier correctement si un administrateur est l\'utilisateur connecté (isCurrentUser)', () => {
      currentUsernameSignal.set('alice_master');
      currentUserFullNameSignal.set('Alice Dupont');

      expect(component.isCurrentUser('alice_master')).toBe(true);
      expect(component.isCurrentUser('ALICE_MASTER')).toBe(true);
      expect(component.isCurrentUser('Alice Dupont')).toBe(true);
      expect(component.isCurrentUser('jean_autre')).toBe(false);
    });
  });

  describe('Navigation par onglets (Général / Administration)', () => {
    it('devrait avoir l\'onglet "général" actif par défaut', () => {
      expect(component.activeTab()).toBe('general');
    });

    it('devrait basculer vers l\'onglet administration via setTab("admin")', () => {
      component.setTab('admin');
      expect(component.activeTab()).toBe('admin');
    });

    it('devrait revenir vers l\'onglet général via setTab("general")', () => {
      component.setTab('admin');
      component.setTab('general');
      expect(component.activeTab()).toBe('general');
    });
  });

  describe('Gestion des administrateurs — addAdmin (US-ORG-08)', () => {
    it('devrait refuser d\'ajouter un admin si le pseudo est vide', () => {
      const warningSpy = vi.spyOn(notifService, 'showWarning');
      const addSpy = vi.spyOn(orgRepo, 'addAdmin');

      component.newAdminUsername.set('   ');
      component.addAdmin();

      expect(warningSpy).toHaveBeenCalledWith("Veuillez saisir un nom d'utilisateur ou pseudo.");
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('devrait refuser d\'ajouter un utilisateur déjà administrateur', () => {
      const warningSpy = vi.spyOn(notifService, 'showWarning');
      const addSpy = vi.spyOn(orgRepo, 'addAdmin');

      component.newAdminUsername.set('alice_master');
      component.addAdmin();

      expect(warningSpy).toHaveBeenCalledWith("Cet utilisateur est déjà administrateur de cette organisation.");
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('devrait ajouter un administrateur avec succès et mettre à jour la liste', () => {
      const updatedOrg: Organization = {
        ...mockOrg,
        adminUsernames: ['alice_master', 'Jean Martin', 'trompette_hero'],
      };

      const addSpy = vi.spyOn(orgRepo, 'addAdmin').mockReturnValue(of(updatedOrg));
      const notifSpy = vi.spyOn(notifService, 'showSuccess');

      component.newAdminUsername.set('trompette_hero');
      component.addAdmin();

      expect(addSpy).toHaveBeenCalledWith(42, 'trompette_hero');
      expect(notifSpy).toHaveBeenCalled();
      expect(component.service.organization()?.adminUsernames).toContain('trompette_hero');
      expect(component.newAdminUsername()).toBe('');
      expect(component.isSubmittingAdmin()).toBe(false);
    });

    it('devrait afficher un message d\'erreur si l\'ajout échoue côté API', () => {
      const errorSpy = vi.spyOn(notifService, 'showError');
      vi.spyOn(orgRepo, 'addAdmin').mockReturnValue(
        throwError(() => ({ error: { message: 'Utilisateur introuvable.' } }))
      );

      component.newAdminUsername.set('utilisateur_inconnu');
      component.addAdmin();

      expect(errorSpy).toHaveBeenCalledWith('Utilisateur introuvable.', "Erreur lors de l'ajout");
      expect(component.isSubmittingAdmin()).toBe(false);
    });
  });

  describe('Gestion des administrateurs — removeAdmin (US-ORG-08)', () => {
    it('devrait refuser qu\'un utilisateur connecté se retire lui-même des administrateurs', () => {
      currentUsernameSignal.set('alice_master');
      currentUserFullNameSignal.set('Alice Dupont');
      component.service.organization.set({
        ...mockOrg,
        adminUsernames: ['alice_master', 'Jean Martin'],
      });

      const warningSpy = vi.spyOn(notifService, 'showWarning');
      const removeSpy = vi.spyOn(orgRepo, 'removeAdmin');

      component.removeAdmin('alice_master');

      expect(warningSpy).toHaveBeenCalledWith("Vous ne pouvez pas vous retirer vous-même des administrateurs.");
      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('devrait refuser de supprimer un administrateur s\'il ne reste qu\'un seul admin', () => {
      component.service.organization.set({
        ...mockOrg,
        adminUsernames: ['seul_admin'],
      });

      const warningSpy = vi.spyOn(notifService, 'showWarning');
      const removeSpy = vi.spyOn(orgRepo, 'removeAdmin');

      component.removeAdmin('seul_admin');

      expect(warningSpy).toHaveBeenCalledWith("Impossible de retirer le seul administrateur de l'organisation.");
      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('devrait retirer un administrateur après confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const updatedOrg: Organization = {
        ...mockOrg,
        adminUsernames: ['alice_master'],
      };

      const removeSpy = vi.spyOn(orgRepo, 'removeAdmin').mockReturnValue(of(updatedOrg));
      const notifSpy = vi.spyOn(notifService, 'showSuccess');

      component.removeAdmin('Jean Martin');

      expect(removeSpy).toHaveBeenCalledWith(42, 'Jean Martin');
      expect(notifSpy).toHaveBeenCalled();
      expect(component.service.organization()?.adminUsernames).not.toContain('Jean Martin');
    });

    it('ne devrait pas retirer un administrateur si l\'utilisateur annule la confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const removeSpy = vi.spyOn(orgRepo, 'removeAdmin');

      component.removeAdmin('Jean Martin');

      expect(removeSpy).not.toHaveBeenCalled();
    });
  });
});
