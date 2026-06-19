import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly pendingRequests = signal(0);

  /** The isLoading property. */
  readonly isLoading = computed(() => this.pendingRequests() > 0);

  /** Executes the increment action. */
  increment() {
    this.pendingRequests.update((count) => count + 1);
  }

  /** Executes the decrement action. */
  decrement() {
    this.pendingRequests.update((count) => Math.max(0, count - 1));
  }
}
