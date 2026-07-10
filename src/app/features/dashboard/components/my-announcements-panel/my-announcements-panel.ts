import { LowerCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { ReinforcementAnnouncement } from '@models/reinforcement';

@Component({
  selector: 'copupitre-my-announcements-panel',
  imports: [LowerCasePipe],
  templateUrl: './my-announcements-panel.html',
  styleUrl: './my-announcements-panel.scss',
})
export class MyAnnouncementsPanel {
  /** The announcements property. */
  announcements = input.required<ReinforcementAnnouncement[]>();

  /** Executes the translateStatus action. */
  translateStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Accepté';
      case 'REJECTED':
        return 'Refusé';
      default:
        return status;
    }
  }
}
