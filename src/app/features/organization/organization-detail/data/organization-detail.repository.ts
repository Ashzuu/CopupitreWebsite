import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Organization, ReinforcementAnnouncement } from '../../../../core/model';

@Injectable({ providedIn: 'root' })
export class OrganizationDetailRepository {
  private readonly http = inject(HttpClient);

  /** Executes the getOrganizationById action. */
  getOrganizationById(id: number): Observable<Organization> {
    return this.http.get<Organization>(`/api/organizations/${id}`);
  }

  /** Executes the getOrganizationAnnouncements action. */
  getOrganizationAnnouncements(orgId: number): Observable<ReinforcementAnnouncement[]> {
    return this.http.get<ReinforcementAnnouncement[]>(`/api/organizations/${orgId}/reinforcements`);
  }
}
