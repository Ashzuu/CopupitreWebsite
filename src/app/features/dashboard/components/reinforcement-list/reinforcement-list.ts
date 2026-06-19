import { DatePipe, LowerCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { ReinforcementAnnouncement } from '../../../../core/model';

@Component({
  selector: 'copupitre-reinforcement-list',
  imports: [DatePipe, LowerCasePipe],
  templateUrl: './reinforcement-list.html',
  styleUrl: './reinforcement-list.scss',
})
export class ReinforcementList {
  /** The announcements property. */
  announcements = input.required<ReinforcementAnnouncement[]>();

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
