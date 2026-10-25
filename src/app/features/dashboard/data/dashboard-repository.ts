import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EquipmentRequest,
  Organization,
  PermanentAnnouncement,
  ReinforcementAnnouncement,
  ReinforcementResponse,
} from '@models/index';
import { EquipmentRepository } from '@repositories/equipment-repository';
import { OrganizationRepository } from '@repositories/organization-repository';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { PermanentRecruitmentsRepository } from '@repositories/permanent-recruitments-repository';

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private readonly equipmentRepo = inject(EquipmentRepository);
  private readonly organizationRepo = inject(OrganizationRepository);
  private readonly reinforcementRepo = inject(ReinforcementsRepository);
  private readonly permanentRepo = inject(PermanentRecruitmentsRepository);

  /** Executes the getUserOrganizations action. */
  getUserOrganizations(): Observable<Organization[]> {
    return this.organizationRepo.getUserOrganizations();
  }

  /** Executes the getAllReinforcementAnnouncements action. */
  getAllReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.reinforcementRepo.getAll();
  }

  /** Executes the getAllPermanentAnnouncements action. */
  getAllPermanentAnnouncements(): Observable<PermanentAnnouncement[]> {
    return this.permanentRepo.getAll();
  }

  /** Executes the getMyPermanentAnnouncements action. */
  getMyPermanentAnnouncements(): Observable<PermanentAnnouncement[]> {
    return this.permanentRepo.getMyPermanentAnnouncements();
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
