import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReinforcementAnnouncement, ReinforcementResponse } from '@models/reinforcement';
import { AuthService } from '@services/auth-service';
import { NotifService } from '@services/notif-service';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';

@Component({
  selector: 'copupitre-reinforcement-list',
  imports: [DatePipe, LowerCasePipe, FormsModule, RouterLink],
  templateUrl: './reinforcement-list.html',
  styleUrl: './reinforcement-list.scss',
})
export class ReinforcementList {
  readonly authService = inject(AuthService);
  private readonly repo = inject(ReinforcementsRepository);
  private readonly notifService = inject(NotifService);

  /** The announcements property. */
  announcements = input.required<ReinforcementAnnouncement[]>();

  /**
   * Optional set of organization IDs the current user administers.
   * When provided, a delete button is shown for announcements belonging to those orgs.
   */
  adminOrgIds = input<number[]>([]);

  /**
   * Optional list of applications made by the current user across announcements.
   */
  userApplications = input<ReinforcementResponse[]>([]);

  /** Emits the id of the announcement to delete. */
  deleteRequest = output<number>();

  /** Emits the newly created application when user applies successfully. */
  applicationApplied = output<ReinforcementResponse>();

  /** Currently selected announcement for applying modal. */
  selectedAnnouncement = signal<ReinforcementAnnouncement | null>(null);

  /** Optional message for application (RG-RENF-10). */
  applicationMessage = signal<string>('');

  /** Loading state during application submission. */
  isSubmitting = signal<boolean>(false);

  /** Returns true if the current user is admin of the organization that created this announcement. */
  canDelete(announcement: ReinforcementAnnouncement): boolean {
    if (!this.authService.isAuthenticated()) return false;
    return this.adminOrgIds().includes(announcement.organizationId);
  }

  onDelete(id: number) {
    this.deleteRequest.emit(id);
  }

  getUserApplication(announcementId: number): ReinforcementResponse | undefined {
    return this.userApplications().find((a) => a.announcementId === announcementId);
  }

  hasApplied(announcementId: number): boolean {
    return !!this.getUserApplication(announcementId);
  }

  canApply(announcement: ReinforcementAnnouncement): boolean {
    if (!this.authService.isAuthenticated()) return false;
    if (announcement.status !== 'OPEN') return false;
    // Les administrateurs d'une organisation ne peuvent pas postuler à leurs propres annonces
    if (this.canDelete(announcement) || this.adminOrgIds().includes(announcement.organizationId)) return false;
    return !this.hasApplied(announcement.id);
  }

  openApplyModal(announcement: ReinforcementAnnouncement) {
    this.selectedAnnouncement.set(announcement);
    this.applicationMessage.set('');
  }

  closeApplyModal() {
    this.selectedAnnouncement.set(null);
    this.applicationMessage.set('');
  }

  submitApplication() {
    const announcement = this.selectedAnnouncement();
    if (!announcement) return;

    if (this.canDelete(announcement) || this.adminOrgIds().includes(announcement.organizationId)) {
      this.notifService.showError('Les administrateurs ne peuvent pas postuler aux annonces de leurs organisations.');
      return;
    }

    this.isSubmitting.set(true);
    const message = this.applicationMessage().trim();

    this.repo.applyToAnnouncement(announcement.id, message).subscribe({
      next: (response) => {
        this.notifService.showSuccess('Votre candidature a été envoyée avec succès.');
        this.applicationApplied.emit(response);
        this.closeApplyModal();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('[ReinforcementList] Error applying to announcement:', err);
        if (!err?._notificationShown) {
          const msg = err?.error?.message || err?.error?.error || "Impossible d'envoyer la candidature.";
          this.notifService.showError(msg);
        }
        this.isSubmitting.set(false);
      },
    });
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'Ouvert';
      case 'OBJECTIVE_MET':
        return 'Objectif Atteint';
      case 'CLOSED':
        return 'Fermé';
      default:
        return status;
    }
  }

  translateAppStatus(status: string): string {
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
}
