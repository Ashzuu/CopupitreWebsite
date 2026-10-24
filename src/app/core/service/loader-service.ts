import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private pendingRequests = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly _isLoading = signal(false);

  /** Signal réactif indiquant si un chargement prolongé est en cours. */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Incrémente le compteur de requêtes.
   * Utilise un seuil de 150ms pour éviter tout scintillement ou "freeze" blanc
   * lors des requêtes HTTP et navigations rapides.
   */
  increment() {
    this.pendingRequests++;
    if (this.pendingRequests === 1) {
      if (typeof setTimeout !== 'undefined') {
        this.timer = setTimeout(() => {
          if (this.pendingRequests > 0) {
            this._isLoading.set(true);
          }
        }, 150);
      } else {
        this._isLoading.set(true);
      }
    }
  }

  /**
   * Décrémente le compteur de requêtes et réinitialise l'état de chargement.
   */
  decrement() {
    this.pendingRequests = Math.max(0, this.pendingRequests - 1);
    if (this.pendingRequests === 0) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this._isLoading.set(false);
    }
  }
}
