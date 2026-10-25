import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Organization, ReinforcementAnnouncement, ReinforcementResponse } from '@models/index';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { ReinforcementList } from '@pages/dashboard/components/reinforcement-list/reinforcement-list';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';

export type ReinforcementTab = 'public' | 'my';

@Component({
  selector: 'copupitre-reinforcements-list-page',
  imports: [BaseLayout, ReinforcementList, FormsModule, RouterLink],
  templateUrl: './reinforcements-list-page.html',
  styleUrl: './reinforcements-list-page.scss',
})
export class ReinforcementsListPage implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private readonly repo = inject(ReinforcementsRepository);
  private readonly orgRepo = inject(OrganizationRepository);
  private readonly notifService = inject(NotifService);
  readonly authService = inject(AuthService);

  readonly userOrganizations = signal<Organization[]>([]);

  /** Onglet actif : 'public' (Demandes publiques) ou 'my' (Mes demandes). */
  activeTab = signal<ReinforcementTab>('public');

  /** IDs of organizations the logged-in user administers – passed to the list component. */
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
  announcements = signal<ReinforcementAnnouncement[]>([]);

  /** Candidatures de l'utilisateur connecté (US-RENF-03). */
  userApplications = signal<ReinforcementResponse[]>([]);

  /** The filterCity property. */
  filterCity = signal('');
  /** The filterOrg property. */
  filterOrg = signal('');
  /** The filterInstrument property. */
  filterInstrument = signal('');

  /** Annonces publiques (excluant les organisations que l'utilisateur administre). */
  publicAnnouncements = computed(() => {
    const adminIds = this.adminOrgIds();
    if (adminIds.length === 0) return this.announcements();
    return this.announcements().filter((a) => !adminIds.includes(a.organizationId));
  });

  /** Annonces créées par les organisations administrées par l'utilisateur connecté ("Mes demandes"). */
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

  /** Rétrocompatibilité : filteredAnnouncements renvoie displayedAnnouncements. */
  filteredAnnouncements = computed(() => this.displayedAnnouncements());

  private filterList(list: ReinforcementAnnouncement[]): ReinforcementAnnouncement[] {
    const city = this.filterCity().trim().toLowerCase();
    const org = this.filterOrg().trim().toLowerCase();
    const instrument = this.filterInstrument().trim().toLowerCase();

    return list.filter((announce) => {
      const loc = (announce.location || announce.eventLocation || '').toLowerCase();
      const orgName = (announce.organizationName || '').toLowerCase();
      const inst = (announce.instrumentNeeded || '').toLowerCase();

      const matchCity = !city || loc.includes(city);
      const matchOrg = !org || orgName.includes(org);
      const matchInstrument = !instrument || inst.includes(instrument);
      return matchCity && matchOrg && matchInstrument;
    });
  }

  setTab(tab: ReinforcementTab) {
    this.activeTab.set(tab);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAnnouncements();

      if (this.authService.isAuthenticated()) {
        this.loadUserApplications();
        this.orgRepo.getUserOrganizations().subscribe({
          next: (orgs) => {
            this.userOrganizations.set(orgs);
          },
          error: (err) => {
            console.error('[ReinforcementListPage] Error fetching user organizations:', err);
          },
        });
      }
    }
  }

  loadUserApplications() {
    this.repo.getMyApplications().subscribe({
      next: (apps) => {
        this.userApplications.set(apps);
      },
      error: (err) => {
        console.error('[ReinforcementListPage] Error fetching user applications:', err);
      },
    });
  }

  private loadAnnouncements() {
    this.repo.getAll().subscribe((data) => {
      this.announcements.set(data);
    });
  }

  onApplicationApplied(app: ReinforcementResponse) {
    this.userApplications.update((apps) => {
      const index = apps.findIndex((a) => a.id === app.id || a.announcementId === app.announcementId);
      if (index >= 0) {
        const copy = [...apps];
        copy[index] = app;
        return copy;
      }
      return [...apps, app];
    });
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

  onDeleteAnnouncement(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    this.repo.deleteAnnouncement(id).subscribe({
      next: () => {
        this.notifService.showSuccess('Annonce supprimée avec succès.');
        this.loadAnnouncements();
      },
      error: (err) => {
        console.error('[ReinforcementListPage] Error deleting announcement:', err);
        if (!err?._notificationShown) {
          const msg = err?.error?.message || err?.error?.error || "Impossible de supprimer l'annonce.";
          this.notifService.showError(msg);
        }
      },
    });
  }
}
