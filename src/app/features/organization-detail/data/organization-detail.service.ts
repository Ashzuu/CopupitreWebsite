import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Organization, ReinforcementAnnouncement } from '../../../core/model';
import { OrganizationDetailRepository } from './organization-detail.repository';

@Injectable()
export class OrganizationDetailService {
  private readonly repo = inject(OrganizationDetailRepository);

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
      this.error.set('Impossible de charger les informations de cette organisation.');
      console.error(e);
    }
  }

  /** Executes the subscribeToAnnouncements action. */
  subscribeToAnnouncements() {
    alert('Vous serez désormais averti des nouvelles annonces de cette organisation !');
  }
}
