import { Injectable, signal } from '@angular/core';

export interface OpenConversationOptions {
  contextType: string;
  contextId: number;
  title?: string;
  subtitle?: string;
}

/**
 * Service centralisé pour orchestrer l'ouverture de la modale de messagerie contextuelle (US-COM-03 & US-COM-04).
 * Permet d'ouvrir la discussion depuis n'importe où (clic notification, clic candidature, prêt matériel).
 */
@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  readonly isOpen = signal<boolean>(false);
  readonly contextType = signal<string>('');
  readonly contextId = signal<number | null>(null);
  readonly title = signal<string>('Fil de discussion');
  readonly subtitle = signal<string>('');

  /**
   * Ouvre la modale de messagerie avec le contexte spécifié.
   */
  open(options: OpenConversationOptions): void {
    this.contextType.set(options.contextType);
    this.contextId.set(options.contextId);
    this.title.set(options.title || 'Fil de discussion');
    this.subtitle.set(options.subtitle || '');
    this.isOpen.set(true);
  }

  /**
   * Ferme la modale de messagerie contextuelle.
   */
  close(): void {
    this.isOpen.set(false);
  }
}
