import { Component, inject } from '@angular/core';
import { NotifService } from '../../../core/service/notif-service';

@Component({
  selector: 'copupitre-global-errors',
  templateUrl: './global-errors.html',
  styleUrl: './global-errors.scss',
})
export class GlobalErrors {
  /** Inject the ErrorService to bind the active notifications array. */
  readonly errorService = inject(NotifService);
}
