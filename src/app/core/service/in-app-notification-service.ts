import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { InAppNotification } from '../model';
import { NotificationRepository } from '../repository/notification-repository';
import { AuthService } from './auth-service';
import { LoggerService } from './logger-service';

/**
 * Service gérant les notifications in-app et le compteur non lu dans l'application (US-COM-02).
 */
@Injectable({
  providedIn: 'root',
})
export class InAppNotificationService {
  private readonly notificationRepo = inject(NotificationRepository);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);

  readonly notifications = signal<InAppNotification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly isOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  /**
   * Charge la liste des notifications de l'utilisateur connecté.
   */
  async loadNotifications(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.notifications.set([]);
      this.unreadCount.set(0);
      return;
    }

    this.isLoading.set(true);
    try {
      const notifs = await firstValueFrom(this.notificationRepo.getMyNotifications());
      this.notifications.set(notifs || []);
      const unread = (notifs || []).filter((n) => !n.isRead).length;
      this.unreadCount.set(unread);
    } catch (err) {
      this.logger.error('Failed to load in-app notifications', 'InAppNotificationService', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Rafraîchit le compteur de notifications non lues.
   */
  async refreshUnreadCount(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.unreadCount.set(0);
      return;
    }

    try {
      const res = await firstValueFrom(this.notificationRepo.getUnreadCount());
      this.unreadCount.set(res?.unreadCount || 0);
    } catch (err) {
      this.logger.error('Failed to refresh unread count', 'InAppNotificationService', err);
    }
  }

  /**
   * Ouvre ou ferme le tiroir des notifications.
   */
  togglePanel(): void {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      this.loadNotifications();
    }
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  /**
   * Marque une notification spécifique comme lue.
   */
  async markAsRead(notification: InAppNotification): Promise<void> {
    if (notification.isRead) return;

    try {
      await firstValueFrom(this.notificationRepo.markAsRead(notification.id));
      this.notifications.update((list) =>
        list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
      this.unreadCount.update((count) => Math.max(0, count - 1));
    } catch (err) {
      this.logger.error('Failed to mark notification as read', 'InAppNotificationService', err);
    }
  }

  /**
   * Marque l'ensemble des notifications comme lues.
   */
  async markAllAsRead(): Promise<void> {
    try {
      await firstValueFrom(this.notificationRepo.markAllAsRead());
      this.notifications.update((list) =>
        list.map((n) => ({ ...n, isRead: true })),
      );
      this.unreadCount.set(0);
    } catch (err) {
      this.logger.error('Failed to mark all notifications as read', 'InAppNotificationService', err);
    }
  }
}
