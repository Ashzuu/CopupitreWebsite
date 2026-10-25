import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EquipmentRequest, Organization, ReinforcementAnnouncement, SubscriptionStatus } from '../model';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class OrganizationRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  getAllOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.BASE_API_URL}/api/organizations/all`);
  }

  getById(orgId: number): Observable<Organization> {
    return this.http.get<Organization>(`${this.BASE_API_URL}/api/organizations/${orgId}`);
  }

  /** Executes the getUserOrganizations action. */
  getUserOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.BASE_API_URL + '/api/organizations/me');
  }

  /** Executes the getOrganizationReinforcements action. */
  getOrganizationReinforcements(orgId: number): Observable<ReinforcementAnnouncement[]> {
    return this.http.get<ReinforcementAnnouncement[]>(
      this.BASE_API_URL + '/api/organizations/' + orgId + '/reinforcements',
    );
  }

  /** Executes the getOrganizationEquipmentRequests action. */
  getOrganizationEquipmentRequests(orgId: number): Observable<EquipmentRequest[]> {
    return this.http.get<EquipmentRequest[]>(
      this.BASE_API_URL + '/api/organizations/' + orgId + '/equipment-requests',
    );
  }

  create(payload: any): Observable<Organization> {
    return this.http.post<Organization>(`${this.BASE_API_URL}/api/organizations/save`, payload);
  }

  /** Adds an administrator to an organization. */
  addAdmin(orgId: number, username: string): Observable<Organization> {
    return this.http.post<Organization>(`${this.BASE_API_URL}/api/organizations/${orgId}/admins`, { username });
  }

  /** Removes an administrator from an organization. */
  removeAdmin(orgId: number, username: string): Observable<Organization> {
    return this.http.delete<Organization>(`${this.BASE_API_URL}/api/organizations/${orgId}/admins/${username}`);
  }

  /** Subscribes current user to organization announcements (US-COM-01). */
  subscribe(orgId: number): Observable<SubscriptionStatus> {
    return this.http.post<SubscriptionStatus>(`${this.BASE_API_URL}/api/organizations/${orgId}/subscribe`, {});
  }

  /** Unsubscribes current user from organization announcements (US-COM-01). */
  unsubscribe(orgId: number): Observable<SubscriptionStatus> {
    return this.http.delete<SubscriptionStatus>(`${this.BASE_API_URL}/api/organizations/${orgId}/subscribe`);
  }

  /** Checks if current user is subscribed to organization announcements (US-COM-01). */
  isSubscribed(orgId: number): Observable<SubscriptionStatus> {
    return this.http.get<SubscriptionStatus>(`${this.BASE_API_URL}/api/organizations/${orgId}/is-subscribed`);
  }
}

