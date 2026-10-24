import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoaderService } from '@services/loader-service';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { ReinforcementList } from '@pages/dashboard/components/reinforcement-list/reinforcement-list';
import { ScheduleTable } from '@pages/dashboard/components/schedule-table/schedule-table';
import { OrganizationDetailService } from './data/organization-detail-service';
import { AuthService } from '@services/auth-service';
import { OrganizationRepository } from '@repositories/organization-repository';
import { NotifService } from '@services/notif-service';

@Component({
  selector: 'copupitre-organization-detail-page',
  imports: [BaseLayout, ScheduleTable, ReinforcementList, DatePipe, RouterLink, FormsModule],
  providers: [OrganizationDetailService],
  templateUrl: './organization-detail-page.html',
  styleUrl: './organization-detail-page.scss',
})
export class OrganizationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  /** The service property. */
  readonly service = inject(OrganizationDetailService);
  /** The loaderService property. */
  readonly loaderService = inject(LoaderService);
  readonly authService = inject(AuthService);
  private readonly orgRepo = inject(OrganizationRepository);
  private readonly notifService = inject(NotifService);

  readonly newAdminUsername = signal('');
  readonly isSubmittingAdmin = signal(false);
  readonly activeTab = signal<'general' | 'admin'>('general');

  setTab(tab: 'general' | 'admin') {
    this.activeTab.set(tab);
  }

  readonly isAdmin = computed(() => {
    const org = this.service.organization();
    if (!org || !org.adminUsernames) return false;
    const username = this.authService.currentUsername();
    const fullName = this.authService.currentUserFullName();
    return (
      (!!username && org.adminUsernames.includes(username)) ||
      (!!fullName && org.adminUsernames.includes(fullName))
    );
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.service.loadOrganizationData(parseInt(idParam, 10));
    }
  }

  addAdmin() {
    const org = this.service.organization();
    const username = this.newAdminUsername().trim();

    if (!org || !username) {
      this.notifService.showWarning("Veuillez saisir un nom d'utilisateur ou pseudo.");
      return;
    }

    if (org.adminUsernames?.includes(username)) {
      this.notifService.showWarning("Cet utilisateur est déjà administrateur de cette organisation.");
      return;
    }

    this.isSubmittingAdmin.set(true);
    this.orgRepo.addAdmin(org.id, username).subscribe({
      next: (updatedOrg) => {
        this.isSubmittingAdmin.set(false);
        this.newAdminUsername.set('');
        if (updatedOrg && updatedOrg.adminUsernames) {
          this.service.organization.set(updatedOrg);
        } else {
          this.service.organization.update((current) =>
            current
              ? {
                  ...current,
                  adminUsernames: [...(current.adminUsernames || []), username],
                }
              : null,
          );
        }
        this.notifService.showSuccess(`L'administrateur "${username}" a bien été ajouté.`);
      },
      error: (err) => {
        this.isSubmittingAdmin.set(false);
        const msg = err?.error?.message || "Impossible d'ajouter cet administrateur. Vérifiez que l'utilisateur existe.";
        this.notifService.showError(msg, "Erreur lors de l'ajout");
      },
    });
  }

  /**
   * Vérifie si le nom d'administrateur correspond à l'utilisateur actuellement connecté.
   */
  isCurrentUser(username: string): boolean {
    if (!username) return false;
    const currentUsername = this.authService.currentUsername();
    const currentUserFullName = this.authService.currentUserFullName();
    return (
      (!!currentUsername && currentUsername.toLowerCase() === username.toLowerCase()) ||
      (!!currentUserFullName && currentUserFullName.toLowerCase() === username.toLowerCase())
    );
  }

  removeAdmin(username: string) {
    const org = this.service.organization();
    if (!org) return;

    if (this.isCurrentUser(username)) {
      this.notifService.showWarning("Vous ne pouvez pas vous retirer vous-même des administrateurs.");
      return;
    }

    if ((org.adminUsernames?.length ?? 0) <= 1) {
      this.notifService.showWarning("Impossible de retirer le seul administrateur de l'organisation.");
      return;
    }

    const confirmed = typeof window !== 'undefined' ? window.confirm(`Êtes-vous sûr de vouloir retirer "${username}" des administrateurs ?`) : true;
    if (!confirmed) return;

    this.orgRepo.removeAdmin(org.id, username).subscribe({
      next: (updatedOrg) => {
        if (updatedOrg && updatedOrg.adminUsernames) {
          this.service.organization.set(updatedOrg);
        } else {
          this.service.organization.update((current) =>
            current
              ? {
                  ...current,
                  adminUsernames: (current.adminUsernames || []).filter((u) => u !== username),
                }
              : null,
          );
        }
        this.notifService.showSuccess(`L'administrateur "${username}" a bien été retiré.`);
      },
      error: (err) => {
        const msg = err?.error?.message || "Impossible de retirer cet administrateur.";
        this.notifService.showError(msg, "Erreur lors du retrait");
      },
    });
  }
}
