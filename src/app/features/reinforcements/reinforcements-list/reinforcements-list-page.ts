import { HttpClient } from '@angular/common/http';
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

@Component({
  selector: 'copupitre-reinforcements-list-page',
  imports: [BaseLayout, ReinforcementList, FormsModule, RouterLink],
  templateUrl: './reinforcements-list-page.html',
  styleUrl: './reinforcements-list-page.scss',
})
export class ReinforcementsListPage implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly repo = inject(ReinforcementsRepository);
  private readonly orgRepo = inject(OrganizationRepository);
  readonly authService = inject(AuthService);

  readonly userOrganizations = signal<Organization[]>([]);
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
  /** The filterDate property. */
  filterDate = signal('');

  /** The filteredAnnouncements property. */
  filteredAnnouncements = computed(() => {
    return this.announcements().filter((a) => {
      const matchCity =
        !this.filterCity() || a.location.toLowerCase().includes(this.filterCity().toLowerCase());
      const matchOrg =
        !this.filterOrg() ||
        a.organizationName.toLowerCase().includes(this.filterOrg().toLowerCase());
      const matchDate = !this.filterDate() || a.eventDate.startsWith(this.filterDate());
      return matchCity && matchOrg && matchDate;
    });
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.repo.getAll().subscribe((data) => {
        this.announcements.set(data);
      });

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
}
