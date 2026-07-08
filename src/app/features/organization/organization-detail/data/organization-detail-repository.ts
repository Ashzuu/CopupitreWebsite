import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Organization, ReinforcementAnnouncement } from '../../../../core/model';
import { OrganizationRepository } from '../../../../core/repository/organization-repository';

@Injectable({ providedIn: 'root' })
export class OrganizationDetailRepository {
  private orgRepo = inject(OrganizationRepository);

  /** Executes the getOrganizationById action. */
  getOrganizationById(id: number): Observable<Organization> {
    return this.orgRepo.getById(id);
  }

  /** Executes the getOrganizationAnnouncements action. */
  getOrganizationAnnouncements(orgId: number): Observable<ReinforcementAnnouncement[]> {
    return this.orgRepo.getOrganizationReinforcements(orgId);
  }
}
