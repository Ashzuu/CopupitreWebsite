import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EquipmentRequest, Organization, ReinforcementAnnouncement } from '../../../core/model';
import { DashboardRepository } from './dashboard-repository';

export interface OrgDashboardBlock {
  /** The organization property. */
  organization: Organization;
  /** The announcements property. */
  announcements: ReinforcementAnnouncement[];
  /** The equipmentRequests property. */
  equipmentRequests: EquipmentRequest[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly repository = inject(DashboardRepository);

  /** The organizations property. */
  readonly organizations = signal<Organization[]>([]);
  /** The allAnnouncements property. */
  readonly allAnnouncements = signal<ReinforcementAnnouncement[]>([]);
  /** The allEquipmentRequests property. */
  readonly allEquipmentRequests = signal<EquipmentRequest[]>([]);

  readonly numberOfReinforcements = signal<number>(0);

  /** The orgBlocks property. */
  readonly orgBlocks = signal<OrgDashboardBlock[]>([]);
  /** The error property. */
  readonly error = signal<string | null>(null);

  /** Executes the loadDashboardData action. */
  async loadDashboardData(): Promise<void> {
    this.error.set(null);
    try {
      const [orgs, allAnnouncements, allEquipment] = await Promise.all([
        firstValueFrom(this.repository.getUserOrganizations()),
        firstValueFrom(this.repository.getAllReinforcementAnnouncements()),
        firstValueFrom(this.repository.getAllEquipmentRequests()),
      ]);
      this.organizations.set(orgs);
      this.allAnnouncements.set(allAnnouncements.slice(0,3));
      this.allEquipmentRequests.set(allEquipment.slice(0, 3));

      this.numberOfReinforcements.set(allAnnouncements.length);

      const blocks: OrgDashboardBlock[] = [];

      for (const org of orgs) {
        const [orgAnnouncements, orgEquipment] = await Promise.all([
          firstValueFrom(this.repository.getOrganizationReinforcements(org.id)),
          firstValueFrom(this.repository.getOrganizationEquipmentRequests(org.id)),
        ]);

        const announcementsWithResponses = await Promise.all(
          orgAnnouncements.map(async (a) => {
            const responses = await firstValueFrom(
              this.repository.getResponsesForAnnouncement(a.id),
            );
            return { ...a, responses };
          }),
        );

        blocks.push({
          organization: org,
          announcements: announcementsWithResponses,
          equipmentRequests: orgEquipment,
        });
      }

      this.orgBlocks.set(blocks);
    } catch (e) {
      this.error.set('Une erreur est survenue lors du chargement des données.');
      console.error('Dashboard data loading error');
    }
  }
}
