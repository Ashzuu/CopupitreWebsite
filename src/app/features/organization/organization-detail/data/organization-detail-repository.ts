import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Organization, ReinforcementAnnouncement } from '@models/index';
import { OrganizationRepository } from '@repositories/organization-repository';

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
