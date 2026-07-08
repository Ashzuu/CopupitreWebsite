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

  /** Displays a notification. */
  show(
    message: string,
    title?: string,
    type: 'error' | 'warning' | 'info' | 'success' = 'error',
    duration = 5000
  ) {
    // Prevent duplicate active notifications with the exact same message and type
    const isDuplicate = this.notifications().some(
      (n) => n.message === message && n.type === type
    );
    if (isDuplicate) {
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: ErrorNotification = { id, title, message, type, duration };

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
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  /** Clears all active notifications. */
  clearAll() {
    this.notifications.set([]);
  }
}
