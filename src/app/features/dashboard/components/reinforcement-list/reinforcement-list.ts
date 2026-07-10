import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { ReinforcementAnnouncement } from '@models/reinforcement';
import { AuthService } from '@services/auth-service';

@Component({
  selector: 'copupitre-reinforcement-list',
  imports: [DatePipe, LowerCasePipe],
  templateUrl: './reinforcement-list.html',
  styleUrl: './reinforcement-list.scss',
})
export class ReinforcementList {
  private readonly authService = inject(AuthService);

  /** The announcements property. */
  announcements = input.required<ReinforcementAnnouncement[]>();

  /**
   * Optional set of organization IDs the current user administers.
   * When provided, a delete button is shown for announcements belonging to those orgs.
   */
  adminOrgIds = input<number[]>([]);

  /** Emits the id of the announcement to delete. */
  deleteRequest = output<number>();

  /** Returns true if the current user is admin of the organization that created this announcement. */
  canDelete(announcement: ReinforcementAnnouncement): boolean {
    if (!this.authService.isAuthenticated()) return false;
    return this.adminOrgIds().includes(announcement.organizationId);
  }

  onDelete(id: number) {
    this.deleteRequest.emit(id);
  }

  /** Executes the translateStatus action. */
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
}
