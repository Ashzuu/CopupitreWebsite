import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Organization, ReinforcementAnnouncement } from '../../../core/model';
import { BaseLayout } from '../../../layout/base-layout/base-layout';
import { ReinforcementList } from '../../dashboard/components/reinforcement-list/reinforcement-list';
import { ReinforcementsRepository } from '../../../core/repository/reinforcements-repository';
import { OrganizationRepository } from '../../../core/repository/organization-repository';
import { AuthService } from '../../../core/service/auth-service';
import { NotifService } from '../../../core/service/notif-service';

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

  /** IDs of organizations the logged-in user administers – passed to the list component. */
  readonly adminOrgIds = computed(() =>
    this.userOrganizations().map((org) => org.id)
  );

  readonly hasAdminOrganization = computed(() => {
    const fullName = this.authService.currentUserFullName();
    if (!fullName) return false;
    return this.userOrganizations().some((org) => org.adminUsernames?.includes(fullName));
  });

  /** The announcements property. */
  announcements = signal<ReinforcementAnnouncement[]>([]);

  /** The filterCity property. */
  filterCity = signal('');
  /** The filterOrg property. */
  filterOrg = signal('');
  /** The filterInstrument property. */
  filterInstrument = signal('');

  /** The filteredAnnouncements property. */
  filteredAnnouncements = computed(() => {
    return this.announcements().filter((announce) => {
      const matchCity =
        !this.filterCity() || announce.location.toLowerCase().includes(this.filterCity().toLowerCase());
      const matchOrg =
        !this.filterOrg() ||
        announce.organizationName.toLowerCase().includes(this.filterOrg().toLowerCase());
      const matchInstrument = !this.filterInstrument() || announce.instrumentNeeded.startsWith(this.filterInstrument());
      return matchCity && matchOrg && matchInstrument;
    });
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAnnouncements();

      if (this.authService.isAuthenticated()) {
        this.orgRepo.getUserOrganizations().subscribe({
          next: (orgs) => {
            this.userOrganizations.set(orgs);
          },
          error: (err) => {
            console.error('Error fetching user organizations:', err);
          },
        });
      }
    }
  }

  private loadAnnouncements() {
    this.repo.getAll().subscribe((data) => {
      this.announcements.set(data);
    });
  }

  onDeleteAnnouncement(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    this.repo.deleteAnnouncement(id).subscribe({
      next: () => {
        this.notifService.showSuccess('Annonce supprimée avec succès.');
        this.loadAnnouncements();
      },
      error: (err) => {
        console.error('Error deleting announcement:', err);
        this.notifService.showError("Impossible de supprimer l'annonce.");
      },
    });
  }
}
