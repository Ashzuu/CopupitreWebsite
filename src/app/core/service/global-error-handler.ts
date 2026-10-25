import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotifService } from './notif-service';
import { LoggerService } from './logger-service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly errorService = inject(NotifService);
  private readonly logger = inject(LoggerService);

  /** Handles the global runtime application errors. */
  handleError(error: any): void {
    let message = "Une erreur inattendue s'est produite dans l'application.";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Journalisation sécurisée vers le serveur
    this.logger.error(message, 'GlobalErrorHandler', error);

    // Notification à l'utilisateur via le service de notifications
    this.errorService.showError(message, "Erreur d'application");
  }
}
