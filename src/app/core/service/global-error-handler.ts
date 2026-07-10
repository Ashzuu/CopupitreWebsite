import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotifService } from './notif-service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly errorService = inject(NotifService);

  /** Handles the global runtime application errors. */
  handleError(error: any): void {
    // Log to console for debugging
    console.error('Unhandled runtime error occurred.');

    let message = "Une erreur inattendue s'est produite dans l'application.";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Notify the user via our custom error service
    this.errorService.showError(message, "Erreur d'application");
  }
}
