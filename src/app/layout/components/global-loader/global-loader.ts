import { Component, inject } from '@angular/core';
import { LoaderService } from '../../../core/service/loader-service';

@Component({
  selector: 'copupitre-global-loader',
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.scss',
})
export class GlobalLoader {
  /** The loaderService property. */
  readonly loaderService = inject(LoaderService);
}
