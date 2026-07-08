import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Organization, ReinforcementAnnouncement } from '../../../../core/model';
import { OrganizationDetailRepository } from './organization-detail-repository';
import { NotifService } from '../../../../core/service/notif-service';

@Injectable()
export class OrganizationDetailService {
  private readonly repo = inject(OrganizationDetailRepository);
  private readonly errorService = inject(NotifService);

  /** The organization property. */
  readonly organization = signal<Organization | null>(null);
  /** The announcements property. */
  readonly announcements = signal<ReinforcementAnnouncement[]>([]);
  /** The error property. */
  readonly error = signal<string | null>(null);

  /** Executes the loadOrganizationData action. */
  async loadOrganizationData(id: number): Promise<void> {
    this.error.set(null);
    try {
      const [org, announcements] = await Promise.all([
        firstValueFrom(this.repo.getOrganizationById(id)),
        firstValueFrom(this.repo.getOrganizationAnnouncements(id)),
      ]);

      if (org) this.organization.set(org);
      if (announcements) this.announcements.set(announcements);
    } catch (e) {
      const msg = 'Impossible de charger les informations de cette organisation.';
      this.error.set(msg);
      this.errorService.showError(msg, 'Chargement échoué');
      console.error('An error occurred while loading organization data.', e);
    }
  }

  /** Executes the subscribeToAnnouncements action. */
  subscribeToAnnouncements() {
    this.errorService.showSuccess(
      'Vous serez désormais averti des nouvelles annonces de cette organisation !',
      'Abonnement réussi'
    );
  }
}
