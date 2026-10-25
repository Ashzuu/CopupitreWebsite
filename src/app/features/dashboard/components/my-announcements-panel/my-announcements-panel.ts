import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { ReinforcementAnnouncement, ReinforcementResponse } from '@models/reinforcement';
import { PermanentAnnouncement } from '@models/permanent-recruitment';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';
import { NotifService } from '@services/notif-service';

export type AnnouncementItem = (ReinforcementAnnouncement | PermanentAnnouncement) & {
  title?: string;
  instrumentNeeded?: string;
};

@Component({
  selector: 'copupitre-my-announcements-panel',
  imports: [LowerCasePipe, DatePipe],
  templateUrl: './my-announcements-panel.html',
  styleUrl: './my-announcements-panel.scss',
})
export class MyAnnouncementsPanel {
  private readonly repo = inject(ReinforcementsRepository);
  private readonly permanentRepo = inject(PermanentRecruitmentsRepository);
  private readonly notifService = inject(NotifService);

  /** Type of announcement: 'RENFORT' (ponctuel) or 'PERMANENT' (annuel). */
  announcementType = input<'RENFORT' | 'PERMANENT'>('RENFORT');

  /** The announcements property. */
  announcements = input.required<AnnouncementItem[]>();

  /** Emits when an application status has been updated. */
  statusUpdated = output<{ announcementId: number; response: ReinforcementResponse }>();

  /** Local writable state for announcements to reflect real-time status transitions. */
  localAnnouncements = signal<AnnouncementItem[]>([]);

  /** Set of application IDs currently updating. */
  updatingAppIds = signal<number[]>([]);

  constructor() {
    effect(() => {
      const items = this.announcements().map((a) => ({
        ...a,
        responses: a.responses ? a.responses.map((r) => ({ ...r })) : [],
      }));
      this.localAnnouncements.set(items);
    });
  }

  isUpdating(appId: number): boolean {
    return this.updatingAppIds().includes(appId);
  }

  getAnnouncementTitle(a: AnnouncementItem): string {
    if (a.title) return a.title;
    if ((a as PermanentAnnouncement).instrument) {
      return `Recrutement ${(a as PermanentAnnouncement).instrument}`;
    }
    return 'Annonce';
  }

  getInstrumentName(a: AnnouncementItem): string {
    return a.instrumentNeeded || (a as PermanentAnnouncement).instrument || '';
  }

  getRequiredCount(a: AnnouncementItem): number {
    return a.requiredCount || (a as any).requiredQuantity || 1;
  }

  updateApplicationStatus(
    announcement: AnnouncementItem,
    response: ReinforcementResponse,
    newStatus: 'ACCEPTED' | 'REJECTED'
  ) {
    if (this.isUpdating(response.id)) return;

    this.updatingAppIds.update((ids) => [...ids, response.id]);

    const req$ =
      this.announcementType() === 'PERMANENT'
        ? this.permanentRepo.updateApplicationStatus(announcement.id, response.id, newStatus)
        : this.repo.updateApplicationStatus(announcement.id, response.id, newStatus);

    req$.subscribe({
      next: (updatedResponse) => {
        // Update local response status
        response.status = newStatus;

        // If accepted, update announcement quota and status
        if (newStatus === 'ACCEPTED') {
          announcement.validatedCount = (announcement.validatedCount || 0) + 1;
          const req = this.getRequiredCount(announcement);
          if (announcement.validatedCount >= req) {
            announcement.status = 'OBJECTIVE_MET';
          }
        }

        this.notifService.showSuccess(
          newStatus === 'ACCEPTED'
            ? 'Candidature acceptée !'
            : 'Candidature refusée.'
        );
        this.statusUpdated.emit({
          announcementId: announcement.id,
          response: updatedResponse,
        });

        this.updatingAppIds.update((ids) => ids.filter((id) => id !== response.id));
      },
      error: (err) => {
        console.error('[MyAnnouncementsPanel] Error updating application status:', err);
        if (!err?._notificationShown) {
          const msg = err?.error?.message || err?.error?.error || 'Impossible de mettre à jour la candidature.';
          this.notifService.showError(msg);
        }
        this.updatingAppIds.update((ids) => ids.filter((id) => id !== response.id));
      },
    });
  }

  /** Executes the translateStatus action. */
  translateStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Accepté';
      case 'REJECTED':
        return 'Refusé';
      case 'OPEN':
        return 'Ouvert';
      case 'OBJECTIVE_MET':
        return 'Objectif atteint';
      case 'CLOSED':
        return 'Fermé';
      default:
        return status;
    }
  }
}
