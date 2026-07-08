import { inject, Injectable } from '@angular/core';
import { EquipmentRepository } from './equipment-repository';
import { Observable } from 'rxjs';
import { EquipmentRequest, Organization, ReinforcementAnnouncement } from '../model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class OrganizationRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

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
}