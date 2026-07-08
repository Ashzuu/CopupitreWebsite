import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotifService } from '../service/notif-service';

/** Use this token in HttpClient requests to bypass global error notifications. */
export const BYPASS_GLOBAL_ERROR = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(NotifService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (req.context.get(BYPASS_GLOBAL_ERROR)) {
        return throwError(() => error);
      }

      let title = 'Erreur réseau';
      let message = 'Une erreur est survenue lors de la communication.';

      if (error.status === 0) {
        title = 'Serveur inaccessible';
        message = 'Impossible de contacter le serveur. Veuillez vérifier votre connexion internet.';
      } else {
        title = `Erreur ${error.status}`;
        
        // Extract message from response payload if present
        if (error.error && typeof error.error === 'object') {
          // Can be error.error.message, error.error.error, etc.
          message = error.error.message || error.error.error || error.error.username || error.message;
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else {
          message = error.message;
        }

        // Custom localized messages based on HTTP Status Codes
        switch (error.status) {
          case 400:
            title = 'Requête incorrecte';
            if (message.includes('Http failure response')) {
              message = 'Les données fournies sont invalides ou incomplètes.';
            }
            break;
          case 401:
            title = 'Non autorisé';
            if (message.includes('Http failure') || message.includes('Unauthorized') || message.toLowerCase().includes('credential')) {
              message = 'Vos identifiants sont incorrects ou votre session a expiré.';
            }
            break;
          case 403:
            title = 'Accès interdit';
            message = "Vous n'avez pas l'autorisation d'accéder à cette fonctionnalité.";
            break;
          case 404:
            title = 'Introuvable';
            message = 'La ressource demandée n\'existe pas ou a été déplacée.';
            break;
          case 500:
            title = 'Erreur serveur';
            message = 'Une erreur interne est survenue sur le serveur. Veuillez réessayer plus tard.';
            break;
        }
      }

      // Display the error visually
      errorService.showError(message, title);

      // Still propagate the error so calling components can react (e.g. stop a loader)
      return throwError(() => error);
    })
  );
};
