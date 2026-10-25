import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Organization, PermanentAnnouncement, ReinforcementAnnouncement } from '@models/index';
import { OrganizationDetailRepository } from './organization-detail-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';

@Injectable()
export class OrganizationDetailService {
  private readonly repo = inject(OrganizationDetailRepository);
  private readonly orgRepo = inject(OrganizationRepository);
  private readonly permanentRepo = inject(PermanentRecruitmentsRepository);
  private readonly authService = inject(AuthService);
  private readonly notifService = inject(NotifService);
  private readonly logger = inject(LoggerService);

  /** The organization property. */
  readonly organization = signal<Organization | null>(null);
  /** The announcements property. */
  readonly announcements = signal<ReinforcementAnnouncement[]>([]);
  /** The permanentAnnouncements property. */
  readonly permanentAnnouncements = signal<PermanentAnnouncement[]>([]);
  /** The error property. */
  readonly error = signal<string | null>(null);

  /** Subscription state to this organization's announcements (US-COM-01). */
  readonly isSubscribed = signal<boolean>(false);
  readonly isSubscriptionLoading = signal<boolean>(false);

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

      // Check subscription status if user is authenticated
      if (this.authService.isAuthenticated()) {
        this.checkSubscription(id);
      }
    } catch (e) {
      const msg = 'Impossible de charger les informations de cette organisation.';
      this.error.set(msg);
      this.notifService.showError(msg, 'Chargement échoué');
      this.logger.error('An error occurred while loading organization data.', 'OrganizationDetailService', e);
    }
  }

  /**
   * Vérifie si l'utilisateur connecté est abonné aux annonces de cette organisation.
   */
  async checkSubscription(orgId: number): Promise<void> {
    if (!this.authService.isAuthenticated()) return;
    try {
      const status = await firstValueFrom(this.orgRepo.isSubscribed(orgId));
      this.isSubscribed.set(status.isSubscribed);
    } catch (err) {
      this.logger.error('Failed to check subscription status', 'OrganizationDetailService', err);
    }
  }

  /**
   * Alterne l'état d'abonnement aux annonces (US-COM-01).
   */
  async toggleSubscription(): Promise<void> {
    const org = this.organization();
    if (!org) return;

    if (!this.authService.isAuthenticated()) {
      this.notifService.showWarning(
        'Veuillez vous connecter pour vous abonner aux annonces de cet ensemble.',
        'Connexion requise',
      );
      return;
    }

    this.isSubscriptionLoading.set(true);
    try {
      if (this.isSubscribed()) {
        await firstValueFrom(this.orgRepo.unsubscribe(org.id));
        this.isSubscribed.set(false);
        this.notifService.showSuccess(
          `Vous êtes désormais désabonné(e) des annonces de l'ensemble "${org.name}".`,
          'Désabonnement pris en compte',
        );
      } else {
        await firstValueFrom(this.orgRepo.subscribe(org.id));
        this.isSubscribed.set(true);
        this.notifService.showSuccess(
          `Vous êtes abonné(e) aux annonces de l'ensemble "${org.name}". Vous recevrez une alerte pour chaque nouveau besoin.`,
          'Abonnement confirmé',
        );
      }
    } catch (err) {
      this.logger.error('Failed to toggle subscription', 'OrganizationDetailService', err);
      this.notifService.showError("Une erreur est survenue lors de la mise à jour de votre abonnement.", 'Erreur');
    } finally {
      this.isSubscriptionLoading.set(false);
    }
  }
}
