import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotifService } from '@services/notif-service';
import { AuthService } from '@services/auth-service';

/** Use this token in HttpClient requests to bypass global error notifications. */
export const BYPASS_GLOBAL_ERROR = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(NotifService);
  const authService = inject(AuthService, { optional: true });
  const router = inject(Router, { optional: true });

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');
      const isUnauthorized = error.status === 401;

      // Déconnexion et redirection automatique immédiate si le token est invalide ou expiré
      if (isUnauthorized && !isAuthEndpoint) {
        if (authService) {
          authService.logout();
        } else if (router) {
          router.navigate(['/login']);
        }
      }

      if (req.context.get(BYPASS_GLOBAL_ERROR)) {
        return throwError(() => error);
      }

      let title = 'Erreur';
      let message = 'Une erreur est survenue lors de la communication.';

      if (error.status === 0) {
        title = 'Serveur inaccessible';
        message = 'Impossible de contacter le serveur. Veuillez vérifier votre connexion internet.';
      } else {
        // 1. Extraction du message d'erreur métier renvoyé par le backend
        let backendMsg: string | null = null;
        if (error.error && typeof error.error === 'object') {
          backendMsg = error.error.message || error.error.error || error.error.detail || error.error.username || null;
          if (backendMsg && backendMsg.includes('Http failure response')) {
            backendMsg = null;
          }
        } else if (typeof error.error === 'string' && error.error.trim().length > 0) {
          if (!error.error.includes('Http failure response')) {
            backendMsg = error.error.trim();
          }
        }

        // 2. Définition du titre et du message selon le statut HTTP
        switch (error.status) {
          case 400:
            title = 'Erreur';
            message = backendMsg || 'Les données fournies sont invalides ou incomplètes.';
            break;
          case 401:
            if (isAuthEndpoint) {
              title = 'Connexion échouée';
              message = backendMsg || 'Identifiants incorrects.';
            } else {
              title = 'Session expirée';
              message = backendMsg || 'Votre session a expiré. Veuillez vous reconnecter.';
            }
            break;
          case 403:
            title = 'Accès interdit';
            message = backendMsg || "Vous n'avez pas l'autorisation d'accéder à cette fonctionnalité.";
            break;
          case 404:
            title = 'Introuvable';
            message = backendMsg || "La ressource demandée n'existe pas ou a été déplacée.";
            break;
          case 409:
            title = 'Conflit';
            message = backendMsg || 'Un conflit est survenu avec les données existantes.';
            break;
          case 500:
          default:
            title = 'Erreur serveur';
            message = backendMsg || 'Une erreur interne est survenue sur le serveur. Veuillez réessayer plus tard.';
            break;
        }
      }

      // Marquer l'erreur pour que les abonnés locaux sachent qu'elle a déjà été notifiée à l'utilisateur
      (error as any)._notificationShown = true;

      // Afficher une seule notification claire et lisible
      errorService.showError(message, title);

      return throwError(() => error);
    })
  );
};
