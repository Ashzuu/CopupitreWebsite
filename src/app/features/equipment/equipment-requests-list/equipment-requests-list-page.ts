import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EquipmentRequest, Organization } from '@models/index';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { EquipmentRepository } from '@repositories/equipment-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';

export type EquipmentTab = 'public' | 'my';
export type EquipmentStatusFilter = 'ALL' | 'OPEN' | 'MET' | 'CLOSED';

@Component({
  selector: 'copupitre-equipment-requests-list-page',
  imports: [CommonModule, FormsModule, RouterLink, BaseLayout],
  templateUrl: './equipment-requests-list-page.html',
  styleUrl: './equipment-requests-list-page.scss',
})
export class EquipmentRequestsListPage implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly equipmentRepo = inject(EquipmentRepository);
  private readonly orgRepo = inject(OrganizationRepository);
  readonly authService = inject(AuthService);
  private readonly notifService = inject(NotifService);
  private readonly logger = inject(LoggerService);

  /** Toutes les demandes de matériel chargées */
  allRequests = signal<EquipmentRequest[]>([]);
  /** Organisations de l'utilisateur connecté */
  userOrganizations = signal<Organization[]>([]);
  /** Onglet actif : 'public' ou 'my' */
  activeTab = signal<EquipmentTab>('public');

  /** Filtres */
  searchTerm = signal<string>('');
  statusFilter = signal<EquipmentStatusFilter>('ALL');

  /** Identifiants des organisations administrées par l'utilisateur */
  adminOrgIds = computed<number[]>(() => {
    return this.userOrganizations().map((o) => o.id);
  });

  /** Indique si l'utilisateur est admin d'au moins une organisation */
  hasUserOrgs = computed<boolean>(() => {
    return this.userOrganizations().length > 0;
  });

  /** Demandes publiques (excluant les organisations administrées par l'utilisateur connecté) */
  publicRequests = computed<EquipmentRequest[]>(() => {
    const adminIds = this.adminOrgIds();
    return this.allRequests().filter((r) => !adminIds.includes(r.organizationId));
  });

  /** Demandes des organisations administrées par l'utilisateur connecté */
  myRequests = computed<EquipmentRequest[]>(() => {
    const adminIds = this.adminOrgIds();
    return this.allRequests().filter((r) => adminIds.includes(r.organizationId));
  });

  /** Demandes filtrées selon l'onglet actif et les filtres de recherche */
  displayedRequests = computed<EquipmentRequest[]>(() => {
    const baseList = this.activeTab() === 'public' ? this.publicRequests() : this.myRequests();
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return baseList.filter((req) => {
      // Filtre statut
      if (status !== 'ALL' && req.status !== status) {
        return false;
      }
      // Filtre recherche textuelle
      if (term) {
        const matchesEquipment = req.equipmentName ? req.equipmentName.toLowerCase().includes(term) : false;
        const matchesOrg = req.organizationName ? req.organizationName.toLowerCase().includes(term) : false;
        const matchesTitle = req.title ? req.title.toLowerCase().includes(term) : false;
        const matchesDesc = req.description ? req.description.toLowerCase().includes(term) : false;
        if (!matchesEquipment && !matchesOrg && !matchesTitle && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRequests();
      if (this.authService.isAuthenticated()) {
        this.loadUserOrganizations();
      }
    }
  }

  loadRequests() {
    this.equipmentRepo.getAllRequests().subscribe({
      next: (data) => {
        this.allRequests.set(data || []);
      },
      error: (err) => {
        this.logger.error('Erreur chargement matériel', 'EquipmentRequestsListPage', err);
        if (!err?._notificationShown) {
          this.notifService.showError('Impossible de charger les demandes de matériel.');
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
        this.logger.error('Erreur chargement organisations', 'EquipmentRequestsListPage', err);
      },
    });
  }

  setTab(tab: EquipmentTab) {
    this.activeTab.set(tab);
  }

  setStatusFilter(status: EquipmentStatusFilter) {
    this.statusFilter.set(status);
  }

  resetFilters() {
    this.searchTerm.set('');
    this.statusFilter.set('ALL');
  }

  isAdminOfOrg(request: EquipmentRequest): boolean {
    return this.adminOrgIds().includes(request.organizationId);
  }

  updateStatus(request: EquipmentRequest, newStatus: 'OPEN' | 'MET' | 'CLOSED') {
    if (!this.isAdminOfOrg(request)) return;

    this.equipmentRepo.updateStatus(request.id, newStatus).subscribe({
      next: (updated) => {
        this.allRequests.update((list) =>
          list.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
        );
        const msg =
          newStatus === 'MET'
            ? 'Matériel marqué comme trouvé !'
            : newStatus === 'CLOSED'
            ? 'Demande clôturée.'
            : 'Demande réouverte.';
        this.notifService.showSuccess(msg);
      },
      error: (err) => {
        this.logger.error('Erreur mise à jour statut', 'EquipmentRequestsListPage', err);
        if (!err?._notificationShown) {
          const message = err?.error?.message || err?.error?.error || 'Impossible de mettre à jour le statut.';
          this.notifService.showError(message);
        }
      },
    });
  }

  deleteRequest(request: EquipmentRequest) {
    if (!this.isAdminOfOrg(request)) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la demande "${request.title}" ?`)) {
      return;
    }

    this.equipmentRepo.deleteRequest(request.id).subscribe({
      next: () => {
        this.allRequests.update((list) => list.filter((r) => r.id !== request.id));
        this.notifService.showSuccess('Demande de matériel supprimée avec succès.');
      },
      error: (err) => {
        this.logger.error('Erreur suppression demande', 'EquipmentRequestsListPage', err);
        if (!err?._notificationShown) {
          const message = err?.error?.message || err?.error?.error || 'Impossible de supprimer la demande.';
          this.notifService.showError(message);
        }
      },
    });
  }

  formatEventDates(dates: string[] | undefined): string {
    if (!dates || dates.length === 0) return 'Dates non spécifiées / Flexibles';
    return dates
      .map((d) => {
        if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
          const [year, month, day] = d.substring(0, 10).split('-');
          return `${day}/${month}/${year}`;
        }
        return d;
      })
      .join(', ');
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'En recherche';
      case 'MET':
        return 'Matériel trouvé';
      case 'CLOSED':
        return 'Clôturé';
      default:
        return status;
    }
  }
}
