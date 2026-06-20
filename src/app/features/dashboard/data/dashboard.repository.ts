import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EquipmentRequest,
  Organization,
  ReinforcementAnnouncement,
  ReinforcementResponse,
} from '../../../core/model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  /** Executes the getUserOrganizations action. */
  getUserOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.BASE_API_URL + '/api/users/me/organizations');
  }

  /** Executes the getAllReinforcementAnnouncements action. */
  getAllReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.http.get<ReinforcementAnnouncement[]>(this.BASE_API_URL + '/api/reinforcements');
  }

  /** Executes the getAllEquipmentRequests action. */
  getAllEquipmentRequests(): Observable<EquipmentRequest[]> {
    return this.http.get<EquipmentRequest[]>(this.BASE_API_URL + '/api/equipment-requests');
  }

  /** Executes the getMyReinforcementAnnouncements action. */
  getMyReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.http.get<ReinforcementAnnouncement[]>(
      this.BASE_API_URL + '/api/users/me/reinforcements',
    );
  }

  /** Executes the getResponsesForAnnouncement action. */
  getResponsesForAnnouncement(announcementId: number): Observable<ReinforcementResponse[]> {
    return this.http.get<ReinforcementResponse[]>(
      `${this.BASE_API_URL}/api/reinforcements/${announcementId}/responses`,
    );
  }

  /** Executes the getOrganizationReinforcements action. */
  getOrganizationReinforcements(orgId: number): Observable<ReinforcementAnnouncement[]> {
    return this.http.get<ReinforcementAnnouncement[]>(
      `${this.BASE_API_URL}/api/organizations/${orgId}/reinforcements`,
    );
  }

  /** Executes the getOrganizationEquipmentRequests action. */
  getOrganizationEquipmentRequests(orgId: number): Observable<EquipmentRequest[]> {
    return this.http.get<EquipmentRequest[]>(
      `${this.BASE_API_URL}/api/organizations/${orgId}/equipment-requests`,
    );
  }
}
