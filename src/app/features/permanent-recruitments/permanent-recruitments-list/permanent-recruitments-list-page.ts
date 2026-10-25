import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Organization, PermanentAnnouncement, ReinforcementResponse } from '@models/index';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { ManageApplicationsModal } from '@pages/dashboard/components/manage-applications-modal/manage-applications-modal';

export type PermanentTab = 'public' | 'my';

@Component({
  selector: 'copupitre-permanent-recruitments-list-page',
  imports: [BaseLayout, FormsModule, RouterLink, LowerCasePipe, ManageApplicationsModal],
  templateUrl: './permanent-recruitments-list-page.html',
  styleUrl: './permanent-recruitments-list-page.scss',
})
export class PermanentRecruitmentsListPage implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private readonly repo = inject(PermanentRecruitmentsRepository);
  private readonly orgRepo = inject(OrganizationRepository);
  private readonly notifService = inject(NotifService);
  readonly authService = inject(AuthService);

  readonly userOrganizations = signal<Organization[]>([]);

  /** Onglet actif : 'public' (Demandes publiques) ou 'my' (Mes demandes). */
  activeTab = signal<PermanentTab>('public');

  /** IDs of organizations the logged-in user administers. */
  readonly adminOrgIds = computed(() =>
    this.userOrganizations().map((org) => org.id)
  );

  readonly hasAdminOrganization = computed(() => {
    const fullName = this.authService.currentUserFullName();
    if (!fullName) return false;
    const username = this.authService.currentUsername();
    return this.userOrganizations().some(
      (org) =>
        (!!username && org.adminUsernames?.includes(username)) ||
        (!!fullName && org.adminUsernames?.includes(fullName)) ||
        (!!fullName && (org.adminDisplayNames?.includes(fullName) ?? false)),
    );
  });

  /** The announcements property. */
  announcements = signal<PermanentAnnouncement[]>([]);

  /** Candidatures de l'utilisateur connecté aux postes permanents. */
  userApplications = signal<ReinforcementResponse[]>([]);

  /** Currently selected announcement for applying modal. */
  selectedAnnouncement = signal<PermanentAnnouncement | null>(null);

  /** Currently selected announcement for managing applications modal. */
  selectedManageAnnouncement = signal<PermanentAnnouncement | null>(null);

  /** Motivation message for applying. */
  applicationMessage = signal<string>('');

  /** Submitting state during application. */
  isSubmitting = signal<boolean>(false);

  /** Filtres */
  filterCity = signal('');
  filterOrg = signal('');
  filterInstrument = signal('');

  /** Annonces publiques (excluant les organisations que l'utilisateur administre). */
  publicAnnouncements = computed(() => {
    const adminIds = this.adminOrgIds();
    if (adminIds.length === 0) return this.announcements();
    return this.announcements().filter((a) => !adminIds.includes(a.organizationId));
  });

  /** Annonces des organisations administrées par l'utilisateur connecté ("Mes demandes"). */
  myAnnouncements = computed(() => {
    const adminIds = this.adminOrgIds();
    if (adminIds.length === 0) return [];
    return this.announcements().filter((a) => adminIds.includes(a.organizationId));
  });

  /** Annonces publiques filtrées. */
  publicFilteredAnnouncements = computed(() =>
    this.filterList(this.publicAnnouncements())
  );

  /** Annonces de mes organisations filtrées. */
  myFilteredAnnouncements = computed(() =>
    this.filterList(this.myAnnouncements())
  );

  /** Annonces affichées selon l'onglet actif. */
  displayedAnnouncements = computed(() =>
    this.activeTab() === 'my'
      ? this.myFilteredAnnouncements()
      : this.publicFilteredAnnouncements()
  );

  private filterList(list: PermanentAnnouncement[]): PermanentAnnouncement[] {
    const city = this.filterCity().trim().toLowerCase();
    const org = this.filterOrg().trim().toLowerCase();
    const instrument = this.filterInstrument().trim().toLowerCase();

    return list.filter((a) => {
      const matchCity = !city || (a.organizationCity?.toLowerCase() || '').includes(city);
      const matchOrg = !org || (a.organizationName?.toLowerCase() || '').includes(org);
      const matchInst = !instrument || (a.instrument?.toLowerCase() || '').includes(instrument);
      return matchCity && matchOrg && matchInst;
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAnnouncements();
      if (this.authService.isAuthenticated()) {
        this.loadUserOrganizations();
        this.loadUserApplications();
      }
    }
  }

  loadAnnouncements() {
    this.repo.getAll().subscribe({
      next: (data) => {
        this.announcements.set(data || []);
      },
      error: (err) => {
        console.error('[PermanentRecruitmentsListPage] Error loading announcements:', err);
        if (!err?._notificationShown) {
          this.notifService.showError('Impossible de charger les annonces de recrutement permanent.');
        }
      },
    });
  }

  loadUserOrganizations() {
    this.orgRepo.getUserOrganizations().subscribe({
      next: (orgs) => {
        this.userOrganizations.set(orgs || []);
      },
      error: (err) => {
        console.error('[PermanentRecruitmentsListPage] Error loading user orgs:', err);
      },
    });
  }

  loadUserApplications() {
    this.repo.getMyApplications().subscribe({
      next: (apps) => {
        this.userApplications.set(apps || []);
      },
      error: (err) => {
        console.error('[PermanentRecruitmentsListPage] Error loading user applications:', err);
      },
    });
  }

  setTab(tab: PermanentTab) {
    this.activeTab.set(tab);
  }

  resetFilters() {
    this.filterCity.set('');
    this.filterOrg.set('');
    this.filterInstrument.set('');
  }

  isAdminOfOrg(announcement: PermanentAnnouncement): boolean {
    return this.adminOrgIds().includes(announcement.organizationId);
  }

  getUserApplication(announcementId: number): ReinforcementResponse | undefined {
    return this.userApplications().find((a) => a.announcementId === announcementId);
  }

  hasApplied(announcementId: number): boolean {
    return !!this.getUserApplication(announcementId);
  }

  canApply(announcement: PermanentAnnouncement): boolean {
    if (!this.authService.isAuthenticated()) return false;
    if (announcement.status !== 'OPEN') return false;
    if (this.isAdminOfOrg(announcement)) return false;
    return !this.hasApplied(announcement.id);
  }

  openApplyModal(announcement: PermanentAnnouncement) {
    this.selectedAnnouncement.set(announcement);
    this.applicationMessage.set('');
  }

  closeApplyModal() {
    this.selectedAnnouncement.set(null);
    this.applicationMessage.set('');
  }

  openManageModal(announcement: PermanentAnnouncement) {
    this.selectedManageAnnouncement.set(announcement);
  }

  closeManageModal() {
    this.selectedManageAnnouncement.set(null);
  }

  onStatusUpdated(event: { announcementId: number; response: ReinforcementResponse }) {
    this.announcements.update((list) =>
      list.map((a) => {
        if (a.id === event.announcementId && a.responses) {
          const updatedResponses = a.responses.map((r) =>
            r.id === event.response.id ? { ...r, status: event.response.status } : r
          );
          return { ...a, responses: updatedResponses };
        }
        return a;
      })
    );
  }

  submitApplication() {
    const ann = this.selectedAnnouncement();
    if (!ann || !this.canApply(ann) || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const msg = this.applicationMessage().trim();

    this.repo.applyToAnnouncement(ann.id, msg).subscribe({
      next: (newApp) => {
        this.notifService.showSuccess('Votre candidature au poste permanent a été envoyée avec succès !');
        this.userApplications.update((apps) => [...apps, newApp]);
        this.isSubmitting.set(false);
        this.closeApplyModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('[PermanentRecruitmentsListPage] Error applying:', err);
        if (!err?._notificationShown) {
          const message = err?.error?.message || err?.error?.error || "Impossible d'envoyer la candidature.";
          this.notifService.showError(message);
        }
      },
    });
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      case 'OPEN':
        return 'Ouvert';
      case 'OBJECTIVE_MET':
        return 'Objectif atteint';
      case 'CLOSED':
        return 'Fermé';
      default:
        return status;
    }
  }

  translateDayOfWeek(day: string): string {
    switch (day) {
      case 'MONDAY':
        return 'Lundi';
      case 'TUESDAY':
        return 'Mardi';
      case 'WEDNESDAY':
        return 'Mercredi';
      case 'THURSDAY':
        return 'Jeudi';
      case 'FRIDAY':
        return 'Vendredi';
      case 'SATURDAY':
        return 'Samedi';
      case 'SUNDAY':
        return 'Dimanche';
      default:
        return day;
    }
  }
}
