import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, HostListener, inject, input, output, signal } from '@angular/core';
import { PermanentAnnouncement } from '@models/permanent-recruitment';
import { ReinforcementAnnouncement, ReinforcementResponse, ResponseStatus } from '@models/reinforcement';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { NotifService } from '@services/notif-service';

export type ManageAnnouncementItem = (ReinforcementAnnouncement | PermanentAnnouncement) & {
  title?: string;
  instrumentNeeded?: string;
};

@Component({
  selector: 'copupitre-manage-applications-modal',
  imports: [LowerCasePipe, DatePipe],
  templateUrl: './manage-applications-modal.html',
  styleUrl: './manage-applications-modal.scss',
})
export class ManageApplicationsModal {
  private readonly repo = inject(ReinforcementsRepository);
  private readonly permanentRepo = inject(PermanentRecruitmentsRepository);
  private readonly notifService = inject(NotifService);

  /** Type of announcement: 'RENFORT' (ponctuel) or 'PERMANENT' (annuel). */
  announcementType = input<'RENFORT' | 'PERMANENT'>('RENFORT');

  /** The announcement whose applications are being managed. */
  announcement = input.required<ManageAnnouncementItem>();

  /** Emits when modal is requested to close. */
  closed = output<void>();

  /** Emits when an application status has been updated. */
  statusUpdated = output<{ announcementId: number; response: ReinforcementResponse }>();

  /** Set of application IDs currently updating. */
  updatingAppIds = signal<number[]>([]);

  /** Active sub-filter: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'. */
  filter = signal<'ALL' | ResponseStatus>('ALL');

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }

  close() {
    this.closed.emit();
  }

  isUpdating(appId: number): boolean {
    return this.updatingAppIds().includes(appId);
  }

  getAnnouncementTitle(): string {
    const a = this.announcement();
    if (a.title) return a.title;
    if ((a as PermanentAnnouncement).instrument) {
      return `Recrutement ${(a as PermanentAnnouncement).instrument}`;
    }
    return 'Annonce';
  }

  getInstrumentName(): string {
    const a = this.announcement();
    return a.instrumentNeeded || (a as PermanentAnnouncement).instrument || '';
  }

  getRequiredCount(): number {
    const a = this.announcement();
    return a.requiredCount || (a as any).requiredQuantity || 1;
  }

  getResponses(): ReinforcementResponse[] {
    const responses = this.announcement().responses || [];
    const currentFilter = this.filter();
    if (currentFilter === 'ALL') return responses;
    return responses.filter((r) => r.status === currentFilter);
  }

  getCountByStatus(status: ResponseStatus): number {
    const responses = this.announcement().responses || [];
    return responses.filter((r) => r.status === status).length;
  }

  updateApplicationStatus(response: ReinforcementResponse, newStatus: 'ACCEPTED' | 'REJECTED') {
    if (this.isUpdating(response.id)) return;
    if (response.status === newStatus) return;

    const previousStatus = response.status;
    this.updatingAppIds.update((ids) => [...ids, response.id]);

    const a = this.announcement();
    const req$ =
      this.announcementType() === 'PERMANENT'
        ? this.permanentRepo.updateApplicationStatus(a.id, response.id, newStatus)
        : this.repo.updateApplicationStatus(a.id, response.id, newStatus);

    req$.subscribe({
      next: (updatedResponse) => {
        response.status = newStatus;

        // Recalculate validated count
        if (newStatus === 'ACCEPTED' && previousStatus !== 'ACCEPTED') {
          a.validatedCount = (a.validatedCount || 0) + 1;
        } else if (previousStatus === 'ACCEPTED' && newStatus !== 'ACCEPTED') {
          a.validatedCount = Math.max(0, (a.validatedCount || 0) - 1);
        }

        const reqCount = this.getRequiredCount();
        if ((a.validatedCount || 0) >= reqCount) {
          a.status = 'OBJECTIVE_MET';
        } else if (a.status === 'OBJECTIVE_MET') {
          a.status = 'OPEN';
        }

        this.notifService.showSuccess(
          newStatus === 'ACCEPTED' ? 'Candidature acceptée !' : 'Candidature refusée.'
        );

        this.statusUpdated.emit({
          announcementId: a.id,
          response: updatedResponse,
        });

        this.updatingAppIds.update((ids) => ids.filter((id) => id !== response.id));
      },
      error: (err) => {
        console.error('[ManageApplicationsModal] Erreur statut candidature:', err);
        if (!err?._notificationShown) {
          const msg =
            err?.error?.message || err?.error?.error || 'Impossible de mettre à jour la candidature.';
          this.notifService.showError(msg);
        }
        this.updatingAppIds.update((ids) => ids.filter((id) => id !== response.id));
      },
    });
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      default:
        return status;
    }
  }

  getMailtoLink(response: ReinforcementResponse): string {
    const email = response.respondentEmail || `${response.respondentUsername}@copupitre.fr`;
    const applicantName = response.respondentFullName || response.respondentUsername;
    const subject = encodeURIComponent(
      `Votre candidature sur Copupitre - ${this.getAnnouncementTitle()}`
    );
    const body = encodeURIComponent(
      `Bonjour ${applicantName},\n\n` +
        `Nous avons bien reçu votre candidature pour « ${this.getAnnouncementTitle()} » au sein de notre ensemble « ${
          this.announcement().organizationName
        } ».\n\n` +
        `Musicalement,\n`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }
}
