import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Organization, PermanentAnnouncement, ReinforcementAnnouncement } from '@models/index';
import { OrganizationDetailRepository } from './organization-detail-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';

@Injectable()
export class OrganizationDetailService {
  private readonly repo = inject(OrganizationDetailRepository);
  private readonly permanentRepo = inject(PermanentRecruitmentsRepository);
  private readonly errorService = inject(NotifService);
  private readonly logger = inject(LoggerService);

  /** The organization property. */
  readonly organization = signal<Organization | null>(null);
  /** The announcements property. */
  readonly announcements = signal<ReinforcementAnnouncement[]>([]);
  /** The permanentAnnouncements property. */
  readonly permanentAnnouncements = signal<PermanentAnnouncement[]>([]);
  /** The error property. */
  readonly error = signal<string | null>(null);

  /** Executes the loadOrganizationData action. */
  async loadOrganizationData(id: number): Promise<void> {
    this.error.set(null);
    try {
      const [org, announcements, allPermanents] = await Promise.all([
        firstValueFrom(this.repo.getOrganizationById(id)),
        firstValueFrom(this.repo.getOrganizationAnnouncements(id)),
        firstValueFrom(this.permanentRepo.getAll()).catch(() => [] as PermanentAnnouncement[]),
      ]);

      if (org) this.organization.set(org);
      if (announcements) this.announcements.set(announcements);
      this.permanentAnnouncements.set(
        allPermanents.filter((p) => p.organizationId === id),
      );
    } catch (e) {
      const msg = 'Impossible de charger les informations de cette organisation.';
      this.error.set(msg);
      this.errorService.showError(msg, 'Chargement échoué');
      this.logger.error('An error occurred while loading organization data.', 'OrganizationDetailService', e);
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
