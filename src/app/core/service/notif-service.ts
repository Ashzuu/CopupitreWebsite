import { Injectable, signal } from '@angular/core';

export interface ErrorNotification {
  id: string;
  title?: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotifService {
  /** The list of active notifications. */
  readonly notifications = signal<ErrorNotification[]>([]);

  /** Horodatage de la dernière notification d'erreur affichée (pour le dédoublonnage d'action). */
  private lastErrorTimestamp = 0;
  private lastErrorId: string | null = null;
  private lastErrorMessage = '';

  /** Helper to determine if an error message is generic boilerplate. */
  private isGenericErrorMessage(msg: string): boolean {
    const text = msg.trim().toLowerCase();
    return (
      text.startsWith('impossible') ||
      text.startsWith('une erreur') ||
      text.startsWith('erreur lors') ||
      text.startsWith('erreur inattendue') ||
      text.startsWith('requête incorrecte') ||
      text.startsWith('chargement échoué')
    );
  }

  /** Displays a notification with smart deduplication and single-error-per-action guarantee. */
  show(
    message: string,
    title?: string,
    type: 'error' | 'warning' | 'info' | 'success' = 'error',
    duration = 5000
  ) {
    const trimmedMessage = message ? message.trim() : '';
    if (!trimmedMessage) return;

    // 1. Prevent identical duplicate notifications active at the same time
    const isDuplicate = this.notifications().some(
      (n) => n.message.toLowerCase() === trimmedMessage.toLowerCase() && n.type === type
    );
    if (isDuplicate) {
      return;
    }

    // 2. Gestion fine des erreurs en rafale (une seule erreur par action utilisateur)
    if (type === 'error') {
      const now = Date.now();
      const isWithinActionWindow = now - this.lastErrorTimestamp < 700;

      if (isWithinActionWindow && this.lastErrorId) {
        const existing = this.notifications().find((n) => n.id === this.lastErrorId);
        if (existing) {
          const incomingIsGeneric = this.isGenericErrorMessage(trimmedMessage);
          const existingIsGeneric = this.isGenericErrorMessage(existing.message);

          // Si l'erreur existante est déjà précise (ex: message renvoyé par l'API)
          // et que la nouvelle est un fallback générique (ex: "Impossible d'envoyer..."),
          // on conserve l'erreur précise et on ignore la générique.
          if (!existingIsGeneric && incomingIsGeneric) {
            return;
          }

          // Si l'erreur existante était générique et que la nouvelle apporte une précision métier,
          // on remplace l'erreur existante au lieu d'empiler une seconde notification.
          if (existingIsGeneric && !incomingIsGeneric) {
            this.notifications.update((list) =>
              list.map((n) =>
                n.id === this.lastErrorId
                  ? { ...n, message: trimmedMessage, title: title || n.title }
                  : n
              )
            );
            this.lastErrorMessage = trimmedMessage;
            return;
          }

          // Si les deux sont équivalentes ou génériques, on n'empile pas de deuxième carte.
          return;
        }
      }

      this.lastErrorTimestamp = now;
      this.lastErrorMessage = trimmedMessage;
    }

    const id = crypto.randomUUID();
    if (type === 'error') {
      this.lastErrorId = id;
    }

    const newNotification: ErrorNotification = { id, title, message: trimmedMessage, type, duration };

    this.notifications.update((list) => [...list, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /** Helper to show an error notification. */
  showError(message: string, title = 'Erreur') {
    this.show(message, title, 'error', 6000);
  }

  /** Helper to show a warning notification. */
  showWarning(message: string, title = 'Attention') {
    this.show(message, title, 'warning', 5000);
  }

  /** Helper to show an info notification. */
  showInfo(message: string, title = 'Information') {
    this.show(message, title, 'info', 4000);
  }

  /** Helper to show a success notification. */
  showSuccess(message: string, title = 'Succès') {
    this.show(message, title, 'success', 4000);
  }

  /** Removes a notification by ID. */
  remove(id: string) {
    if (this.lastErrorId === id) {
      this.lastErrorId = null;
    }
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  /** Clears all active notifications. */
  clearAll() {
    this.lastErrorId = null;
    this.notifications.set([]);
  }
}
