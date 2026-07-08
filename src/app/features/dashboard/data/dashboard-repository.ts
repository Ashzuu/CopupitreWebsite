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
import { EquipmentRepository } from '../../../core/repository/equipment-repository';
import { OrganizationRepository } from '../../../core/repository/organization-repository';
import { ReinforcementsRepository } from '../../../core/repository/reinforcements-repository';

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private readonly equipmentRepo = inject(EquipmentRepository);
  private readonly organizationRepo = inject(OrganizationRepository);
  private readonly reinforcementRepo = inject(ReinforcementsRepository);

  /** Executes the getUserOrganizations action. */
  getUserOrganizations(): Observable<Organization[]> {
    return this.organizationRepo.getUserOrganizations();
  }

  /** Executes the getAllReinforcementAnnouncements action. */
  getAllReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.reinforcementRepo.getAll();
  }

  /** Executes the getAllEquipmentRequests action. */
  getAllEquipmentRequests(): Observable<EquipmentRequest[]> {
    return this.equipmentRepo.getAllRequests();
  }

  /** Executes the getMyReinforcementAnnouncements action. */
  getMyReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.reinforcementRepo.getMyReinforcementAnnouncements();
  }

  /** Executes the getResponsesForAnnouncement action. */
  getResponsesForAnnouncement(announcementId: number): Observable<ReinforcementResponse[]> {
    return this.reinforcementRepo.getResponsesForAnnouncement(announcementId);
  }

  /** Executes the getOrganizationReinforcements action. */
  getOrganizationReinforcements(orgId: number): Observable<ReinforcementAnnouncement[]> {
    return this.organizationRepo.getOrganizationReinforcements(orgId);
  }

  /** Executes the getOrganizationEquipmentRequests action. */
  getOrganizationEquipmentRequests(orgId: number): Observable<EquipmentRequest[]> {
    return this.organizationRepo.getOrganizationEquipmentRequests(orgId);
  }
}
