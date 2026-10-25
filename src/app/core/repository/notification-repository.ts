import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InAppNotification } from '../model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  getMyNotifications(): Observable<InAppNotification[]> {
    return this.http.get<InAppNotification[]>(`${this.BASE_API_URL}/api/notifications/me`);
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.BASE_API_URL}/api/notifications/unread-count`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE_API_URL}/api/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.BASE_API_URL}/api/notifications/mark-all-read`, {});
  }
}
