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

  describe('Abonnement aux annonces (US-COM-01)', () => {
    it('devrait alterner l\'état d\'abonnement via service.toggleSubscription()', async () => {
      vi.spyOn(orgRepo, 'subscribe').mockReturnValue(of({ organizationId: 42, isSubscribed: true }));
      const notifSuccessSpy = vi.spyOn(notifService, 'showSuccess');

      expect(component.service.isSubscribed()).toBe(false);

      await component.service.toggleSubscription();

      expect(orgRepo.subscribe).toHaveBeenCalledWith(42);
      expect(component.service.isSubscribed()).toBe(true);
      expect(notifSuccessSpy).toHaveBeenCalled();
    });

    it('devrait désabonner lorsque l\'utilisateur est déjà abonné', async () => {
      component.service.isSubscribed.set(true);
      vi.spyOn(orgRepo, 'unsubscribe').mockReturnValue(of({ organizationId: 42, isSubscribed: false }));
      const notifSuccessSpy = vi.spyOn(notifService, 'showSuccess');

      await component.service.toggleSubscription();

      expect(orgRepo.unsubscribe).toHaveBeenCalledWith(42);
      expect(component.service.isSubscribed()).toBe(false);
      expect(notifSuccessSpy).toHaveBeenCalled();
    });
  });

  describe('Prise de contact avec l\'orchestre', () => {
    it('devrait rediriger vers /login avec avertissement si non connecté', () => {
      mockAuthService.isAuthenticated.set(false);
      const warnSpy = vi.spyOn(notifService, 'showWarning');
      const routerSpy = vi.spyOn((component as any).router, 'navigate');

      component.contactOrganization();

      expect(warnSpy).toHaveBeenCalledWith(
        'Veuillez vous connecter pour contacter cette organisation.',
        'Connexion requise',
      );
      expect(routerSpy).toHaveBeenCalledWith(['/login']);
    });

    it('devrait rediriger vers la messagerie si connecté', () => {
      mockAuthService.isAuthenticated.set(true);
      const routerSpy = vi.spyOn((component as any).router, 'navigate');

      component.contactOrganization();

      expect(routerSpy).toHaveBeenCalledWith(['/messagerie']);
    });
  });

  describe('EPIC 02: Gestion des Musiciens (UC-ORG-09)', () => {
    it('devrait refuser l\'ajout manuel si des champs sont manquants', () => {
      const warnSpy = vi.spyOn(notifService, 'showWarning');
      component.newMusician.set({ firstName: '', lastName: '', email: '', instrument: '' });

      component.submitAddMusician();

      expect(warnSpy).toHaveBeenCalledWith('Veuillez remplir tous les champs obligatoires.');
    });

    it('devrait ajouter un musicien manuellement et réinitialiser le formulaire (US-ORG-10, RG-ORG-11)', async () => {
      const addSpy = vi.spyOn(component.service, 'addMusician').mockResolvedValue({
        id: 10,
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@test.fr',
        instrument: 'Violon',
      });
      const successSpy = vi.spyOn(notifService, 'showSuccess');

      component.newMusician.set({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@test.fr',
        instrument: 'Violon',
      });

      component.submitAddMusician();
      await Promise.resolve();

      expect(addSpy).toHaveBeenCalledWith(42, {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@test.fr',
        instrument: 'Violon',
      });
      expect(component.showAddMusicianForm()).toBe(false);
      expect(successSpy).toHaveBeenCalled();
    });

    it('devrait importer un fichier CSV et afficher le bilan (US-ORG-09, RG-ORG-10)', async () => {
      const mockResult = {
        totalRows: 2,
        importedCount: 2,
        skippedCount: 0,
        errorCount: 0,
        messages: [],
        musicians: [],
      };
      const importSpy = vi.spyOn(component.service, 'importCsv').mockResolvedValue(mockResult);
      const successSpy = vi.spyOn(notifService, 'showSuccess');

      const file = new File(['dummy'], 'musiciens.csv', { type: 'text/csv' });
      component.selectedCsvFile.set(file);

      component.submitCsvImport();
      await Promise.resolve();

      expect(importSpy).toHaveBeenCalledWith(42, file);
      expect(component.csvImportResult()).toEqual(mockResult);
      expect(successSpy).toHaveBeenCalled();
    });

    it('devrait supprimer un musicien de l\'organisation (US-ORG-11)', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const removeSpy = vi.spyOn(component.service, 'removeMusician').mockResolvedValue();
      const successSpy = vi.spyOn(notifService, 'showSuccess');
      const musician = { id: 7, firstName: 'Paul', lastName: 'Nérac', email: 'paul@test.fr', instrument: 'Cor' };

      component.deleteMusician(musician);
      await Promise.resolve();

      expect(removeSpy).toHaveBeenCalledWith(42, 7);
      expect(successSpy).toHaveBeenCalled();
    });

    it('devrait associer un musicien existant à un compte utilisateur par email (US-ORG-12)', async () => {
      const associateSpy = vi.spyOn(component.service, 'associateUser').mockResolvedValue({
        id: 7,
        firstName: 'Paul',
        lastName: 'Nérac',
        email: 'paul@test.fr',
        instrument: 'Cor',
        userId: 99,
        username: 'paul99',
      });
      const successSpy = vi.spyOn(notifService, 'showSuccess');

      const musician = { id: 7, firstName: 'Paul', lastName: 'Nérac', email: 'paul@test.fr', instrument: 'Cor' };
      component.openAssociateModal(musician);
      component.associateEmail.set('user@copupitre.fr');

      component.submitAssociateUser();
      await Promise.resolve();

      expect(associateSpy).toHaveBeenCalledWith(42, 7, 'user@copupitre.fr');
      expect(component.showAssociateModal()).toBe(false);
      expect(successSpy).toHaveBeenCalled();
    });
  });

  describe('EPIC 07: Gestion des Absences', () => {
    it('devrait charger les statistiques et les absences lors du changement de période (RG-ABS-02)', () => {
      const loadStatsSpy = vi.spyOn(component.service, 'loadAbsenceStats').mockResolvedValue();
      const loadAbsencesSpy = vi.spyOn(component.service, 'loadAbsences').mockResolvedValue();

      component.setPeriod('3m');

      expect(component.selectedPeriod()).toBe('3m');
      expect(loadStatsSpy).toHaveBeenCalled();
      expect(loadAbsencesSpy).toHaveBeenCalled();
    });

    it('devrait enregistrer une absence valide (US-ABS-01, RG-ABS-01)', async () => {
      const registerSpy = vi.spyOn(component.service, 'registerAbsence').mockResolvedValue({
        id: 1,
        organizationId: 42,
        musicianId: 10,
        musicianFirstName: 'Jean',
        musicianLastName: 'Dupont',
        musicianEmail: 'jean@test.fr',
        instrument: 'Violon',
        eventType: 'REHEARSAL',
        eventDate: '2026-11-20',
        reason: 'Voyage',
        status: 'JUSTIFIED',
        submittedByAdmin: true,
        createdAt: '2026-11-12T10:00:00Z',
      });
      const successSpy = vi.spyOn(notifService, 'showSuccess');

      component.newAbsenceData.set({
        musicianId: 10,
        eventType: 'REHEARSAL',
        eventDate: '2026-11-20',
        endDate: '',
        reason: 'Voyage',
        status: 'JUSTIFIED',
      });

      component.submitAbsence();
      await Promise.resolve();

      expect(registerSpy).toHaveBeenCalled();
      expect(component.showAbsenceModal()).toBe(false);
      expect(successSpy).toHaveBeenCalled();
    });

    it('devrait mettre à jour le statut d\'une absence (RG-ABS-04)', async () => {
      const updateSpy = vi.spyOn(component.service, 'updateAbsenceStatus').mockResolvedValue({
        id: 5,
        organizationId: 42,
        musicianId: 10,
        musicianFirstName: 'Jean',
        musicianLastName: 'Dupont',
        musicianEmail: 'jean@test.fr',
        instrument: 'Violon',
        eventType: 'CONCERT',
        eventDate: '2026-12-01',
        reason: 'Motif',
        status: 'JUSTIFIED',
        submittedByAdmin: false,
        createdAt: '2026-11-12T10:00:00Z',
      });
      const successSpy = vi.spyOn(notifService, 'showSuccess');

      const mockAbsence = {
        id: 5,
        organizationId: 42,
        musicianId: 10,
        musicianFirstName: 'Jean',
        musicianLastName: 'Dupont',
        musicianEmail: 'jean@test.fr',
        instrument: 'Violon',
        eventType: 'CONCERT' as const,
        eventDate: '2026-12-01',
        reason: 'Motif',
        status: 'PENDING' as const,
        submittedByAdmin: false,
        createdAt: '2026-11-12T10:00:00Z',
      };

      component.changeAbsenceStatus(mockAbsence, 'JUSTIFIED');
      await Promise.resolve();

      expect(updateSpy).toHaveBeenCalledWith(42, 5, 'JUSTIFIED');
      expect(successSpy).toHaveBeenCalled();
    });

    it('devrait avertir les membres d\'une annulation d\'événement (RG-ABS-03, UC-ABS-04)', async () => {
      const notifySpy = vi.spyOn(component.service, 'notifyEventCancellation').mockResolvedValue();
      const successSpy = vi.spyOn(notifService, 'showSuccess');

      component.cancelEventData.set({
        eventType: 'REHEARSAL',
        eventDate: '2026-11-25',
        message: 'Intempéries',
      });

      component.submitCancelEvent();
      await Promise.resolve();

      expect(notifySpy).toHaveBeenCalledWith(42, {
        eventType: 'REHEARSAL',
        eventDate: '2026-11-25',
        message: 'Intempéries',
      });
      expect(component.showCancelEventModal()).toBe(false);
      expect(successSpy).toHaveBeenCalled();
    });
  });
});
