import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EquipmentRequest,
  Organization,
  ReinforcementAnnouncement,
  ReinforcementResponse,
} from '../../../core/model';

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private readonly http = inject(HttpClient);

  /** Executes the getUserOrganizations action. */
  getUserOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>('/api/users/me/organizations');
  }

  /** Executes the getAllReinforcementAnnouncements action. */
  getAllReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.http.get<ReinforcementAnnouncement[]>('/api/reinforcements');
  }

  /** Executes the getAllEquipmentRequests action. */
  getAllEquipmentRequests(): Observable<EquipmentRequest[]> {
    return this.http.get<EquipmentRequest[]>('/api/equipment-requests');
  }

  /** Executes the getMyReinforcementAnnouncements action. */
  getMyReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.http.get<ReinforcementAnnouncement[]>('/api/users/me/reinforcements');
  }

  /** Executes the getResponsesForAnnouncement action. */
  getResponsesForAnnouncement(announcementId: number): Observable<ReinforcementResponse[]> {
    return this.http.get<ReinforcementResponse[]>(
      `/api/reinforcements/${announcementId}/responses`,
    );
  }

  /** Executes the getOrganizationReinforcements action. */
  getOrganizationReinforcements(orgId: number): Observable<ReinforcementAnnouncement[]> {
    return this.http.get<ReinforcementAnnouncement[]>(`/api/organizations/${orgId}/reinforcements`);
  }

  /** Executes the getOrganizationEquipmentRequests action. */
  getOrganizationEquipmentRequests(orgId: number): Observable<EquipmentRequest[]> {
    return this.http.get<EquipmentRequest[]>(`/api/organizations/${orgId}/equipment-requests`);
  }
}
