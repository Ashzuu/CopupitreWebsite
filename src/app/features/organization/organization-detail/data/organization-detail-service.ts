import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Absence,
  AbsenceStats,
  AbsenceStatus,
  CancelEventNotificationRequest,
  CreateAbsenceRequest,
  CreateMusicianRequest,
  CsvImportResult,
  EventType,
  Musician,
  Organization,
  PermanentAnnouncement,
  ReinforcementAnnouncement,
} from '@models/index';
import { OrganizationDetailRepository } from './organization-detail-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { MusicianRepository } from '@repositories/musician-repository';
import { AbsenceRepository } from '@repositories/absence-repository';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';

@Injectable()
export class OrganizationDetailService {
  private readonly repo = inject(OrganizationDetailRepository);
  private readonly orgRepo = inject(OrganizationRepository);
  private readonly permanentRepo = inject(PermanentRecruitmentsRepository);
  private readonly musicianRepo = inject(MusicianRepository);
  private readonly absenceRepo = inject(AbsenceRepository);
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

  /** Musiciens de l'organisation (Epic 02). */
  readonly musicians = signal<Musician[]>([]);
  readonly isMusiciansLoading = signal<boolean>(false);

  /** Absences et statistiques (Epic 07). */
  readonly absences = signal<Absence[]>([]);
  readonly absenceStats = signal<AbsenceStats[]>([]);
  readonly isAbsencesLoading = signal<boolean>(false);

  /** Executes the loadOrganizationData action. */
  async loadOrganizationData(identifier: number | string): Promise<void> {
    this.error.set(null);
    try {
      const org = await firstValueFrom(this.repo.getOrganizationById(identifier));
      if (!org) {
        throw new Error('Organisation introuvable');
      }

      this.organization.set(org);
      const realId = org.id;

      const [announcements, allPermanents] = await Promise.all([
        firstValueFrom(this.repo.getOrganizationAnnouncements(realId)).catch(() => [] as ReinforcementAnnouncement[]),
        firstValueFrom(this.permanentRepo.getAll()).catch(() => [] as PermanentAnnouncement[]),
      ]);

      if (announcements) this.announcements.set(announcements);
      this.permanentAnnouncements.set(
        allPermanents.filter((p) => p.organizationId === realId),
      );

      // Check subscription status if user is authenticated
      if (this.authService.isAuthenticated()) {
        this.checkSubscription(realId);
      }
    } catch (e) {
      const msg = 'Impossible de charger les informations de cette organisation.';
      this.error.set(msg);
      this.notifService.showError(msg, 'Chargement échoué');
      this.logger.error('An error occurred while loading organization data.', 'OrganizationDetailService', e);
    }
  }

  /**
   * Charge la liste des musiciens de l'organisation (Epic 02).
   */
  async loadMusicians(orgId: number | string): Promise<void> {
    this.isMusiciansLoading.set(true);
    try {
      const list = await firstValueFrom(this.musicianRepo.getOrganizationMusicians(orgId));
      this.musicians.set(list || []);
    } catch (err) {
      this.logger.error('Impossible de charger les musiciens.', 'OrganizationDetailService', err);
    } finally {
      this.isMusiciansLoading.set(false);
    }
  }

  /**
   * Ajoute un musicien manuellement (RG-ORG-11, US-ORG-10).
   */
  async addMusician(orgId: number | string, req: CreateMusicianRequest): Promise<Musician> {
    const created = await firstValueFrom(this.musicianRepo.addMusician(orgId, req));
    this.musicians.update((current) => [...current, created]);
    return created;
  }

  /**
   * Importe des musiciens par fichier CSV (RG-ORG-10, US-ORG-09).
   */
  async importCsv(orgId: number | string, file: File): Promise<CsvImportResult> {
    const result = await firstValueFrom(this.musicianRepo.importCsvFile(orgId, file));
    await this.loadMusicians(orgId);
    return result;
  }

  /**
   * Supprime un musicien de l'organisation (US-ORG-11).
   */
  async removeMusician(orgId: number | string, musicianId: number): Promise<void> {
    await firstValueFrom(this.musicianRepo.removeMusician(orgId, musicianId));
    this.musicians.update((current) => current.filter((m) => m.id !== musicianId));
  }

  /**
   * Associe un musicien existant à un compte utilisateur via email (US-ORG-12).
   */
  async associateUser(orgId: number | string, musicianId: number, email: string): Promise<Musician> {
    const updated = await firstValueFrom(this.musicianRepo.associateUser(orgId, musicianId, email));
    this.musicians.update((current) =>
      current.map((m) => (m.id === musicianId ? updated : m)),
    );
    return updated;
  }

  /**
   * Charge la liste filtrée des absences (Epic 07).
   */
  async loadAbsences(
    orgId: number | string,
    filters?: {
      startDate?: string;
      endDate?: string;
      eventType?: EventType;
      status?: AbsenceStatus;
      musicianId?: number;
    },
  ): Promise<void> {
    this.isAbsencesLoading.set(true);
    try {
      const list = await firstValueFrom(this.absenceRepo.getAbsences(orgId, filters));
      this.absences.set(list || []);
    } catch (err) {
      this.logger.error('Impossible de charger les absences.', 'OrganizationDetailService', err);
    } finally {
      this.isAbsencesLoading.set(false);
    }
  }

  /**
   * Charge les statistiques et compteurs d'absences par musicien (RG-ABS-02).
   */
  async loadAbsenceStats(orgId: number | string, startDate?: string, endDate?: string): Promise<void> {
    try {
      const stats = await firstValueFrom(this.absenceRepo.getStats(orgId, startDate, endDate));
      this.absenceStats.set(stats || []);
    } catch (err) {
      this.logger.error('Impossible de charger les statistiques des absences.', 'OrganizationDetailService', err);
    }
  }

  /**
   * Enregistre une nouvelle absence (RG-ABS-01, RG-ABS-04, US-ABS-01).
   */
  async registerAbsence(orgId: number | string, req: CreateAbsenceRequest): Promise<Absence> {
    const created = await firstValueFrom(this.absenceRepo.registerAbsence(orgId, req));
    this.absences.update((current) => [created, ...current]);
    return created;
  }

  /**
   * Met à jour le statut d'une absence (RG-ABS-04).
   */
  async updateAbsenceStatus(orgId: number | string, absenceId: number, status: AbsenceStatus): Promise<Absence> {
    const updated = await firstValueFrom(this.absenceRepo.updateStatus(orgId, absenceId, status));
    this.absences.update((current) =>
      current.map((a) => (a.id === absenceId ? updated : a)),
    );
    return updated;
  }

  /**
   * Notifie les membres d'une annulation d'événement (RG-ABS-03, UC-ABS-04).
   */
  async notifyEventCancellation(orgId: number | string, req: CancelEventNotificationRequest): Promise<void> {
    await firstValueFrom(this.absenceRepo.notifyCancellation(orgId, req));
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
      this.notifService.showError('Une erreur est survenue lors de la mise à jour de votre abonnement.', 'Erreur');
    } finally {
      this.isSubscriptionLoading.set(false);
    }
  }
}
