import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@environments/environment';

export interface ClientLogPayload {
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  context?: string;
  url?: string;
  stack?: string;
  timestamp?: string;
}

/**
 * Service de journalisation fine et sécurisée côté client.
 * <p>
 * Remplace l'usage de console.log et console.error dans le code applicatif
 * pour empêcher la fuite d'informations sensibles (détectée par l'analyseur Bearer)
 * et centralise les logs d'erreurs et d'événements dans des fichiers côté serveur.
 * </p>
 */
@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly logUrl = `${environment.BASE_API_URL}/api/logs`;

  /**
   * Envoie une erreur applicative vers les fichiers de logs du serveur.
   */
  error(message: string, context?: string, error?: unknown): void {
    let stack: string | undefined;
    let detail = message;

    if (error instanceof Error) {
      stack = error.stack;
      detail = `${message} — ${error.message}`;
    } else if (error && typeof error === 'object') {
      try {
        const errObj = error as any;
        const msg =
          errObj?.error?.message ||
          errObj?.error?.error ||
          errObj?.statusText ||
          errObj?.message ||
          JSON.stringify(error);
        detail = `${message} — ${msg}`;
      } catch {
        detail = message;
      }
    } else if (typeof error === 'string') {
      detail = `${message} — ${error}`;
    }

    this.send({
      level: 'ERROR',
      message: detail,
      context,
      stack,
    });
  }

  /**
   * Envoie un avertissement applicatif vers les fichiers de logs du serveur.
   */
  warn(message: string, context?: string, data?: unknown): void {
    let detail = message;
    if (data && typeof data === 'object') {
      try {
        detail = `${message} — ${JSON.stringify(data)}`;
      } catch {
        detail = message;
      }
    } else if (typeof data === 'string') {
      detail = `${message} — ${data}`;
    }

    this.send({
      level: 'WARN',
      message: detail,
      context,
    });
  }

  /**
   * Envoie un événement informatif vers les fichiers de logs du serveur.
   */
  info(message: string, context?: string, data?: unknown): void {
    let detail = message;
    if (data && typeof data === 'object') {
      try {
        detail = `${message} — ${JSON.stringify(data)}`;
      } catch {
        detail = message;
      }
    } else if (typeof data === 'string') {
      detail = `${message} — ${data}`;
    }

    this.send({
      level: 'INFO',
      message: detail,
      context,
    });
  }

  private send(payload: ClientLogPayload): void {
    payload.timestamp = new Date().toISOString();

    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
      payload.url = window.location.pathname;
    }

    // Transmission asynchrone sécurisée sans console.error de secours en cas d'erreur réseau
    this.http.post<void>(this.logUrl, payload).subscribe({
      next: () => {},
      error: () => {
        // En cas d'indisponibilité du serveur, échec silencieux pour éviter toute boucle infinie
      },
    });
  }
}
