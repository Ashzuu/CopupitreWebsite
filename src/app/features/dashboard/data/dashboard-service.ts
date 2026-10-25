import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { EquipmentRequest, Organization, PermanentAnnouncement, ReinforcementAnnouncement } from '@models/index';
import { DashboardRepository } from './dashboard-repository';

export interface OrgDashboardBlock {
  /** The organization property. */
  organization: Organization;
  /** The announcements property (Renforts ponctuels). */
  announcements: ReinforcementAnnouncement[];
  /** The equipmentRequests property. */
  equipmentRequests: EquipmentRequest[];
  /** The permanentAnnouncements property (Recrutements permanents / Besoins annuels). */
  permanentAnnouncements: PermanentAnnouncement[];
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
      const [orgs, allAnnouncements, allEquipment, myPermanentAnnouncements] = await Promise.all([
        firstValueFrom(this.repository.getUserOrganizations()),
        firstValueFrom(this.repository.getAllReinforcementAnnouncements()),
        firstValueFrom(this.repository.getAllEquipmentRequests()),
        firstValueFrom(this.repository.getMyPermanentAnnouncements()).catch(() => [] as PermanentAnnouncement[]),
      ]);
      this.organizations.set(orgs);

      // Exclure les annonces des organisations administrées du panel des offres publiques
      const userOrgIds = new Set(orgs.map((o) => o.id));
      const publicAnnouncements = allAnnouncements.filter((a) => !userOrgIds.has(a.organizationId));
      const publicEquipment = allEquipment.filter((e) => !userOrgIds.has(e.organizationId));
      this.allAnnouncements.set(publicAnnouncements);
      this.allEquipmentRequests.set(publicEquipment);

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

        const orgPermanent = myPermanentAnnouncements.filter((p) => p.organizationId === org.id);

        blocks.push({
          organization: org,
          announcements: announcementsWithResponses,
          equipmentRequests: orgEquipment,
          permanentAnnouncements: orgPermanent,
        });
      }

      this.orgBlocks.set(blocks);
    } catch (e) {
      this.error.set('Une erreur est survenue lors du chargement des données.');
      console.error('Dashboard data loading error', e);
    }
  }

  /** Met à jour le statut d'une demande de matériel */
  updateEquipmentStatus(requestId: number, status: 'OPEN' | 'MET' | 'CLOSED'): Observable<EquipmentRequest> {
    return this.repository.updateEquipmentStatus(requestId, status);
  }

  /** Supprime une demande de matériel */
  deleteEquipmentRequest(requestId: number): Observable<void> {
    return this.repository.deleteEquipmentRequest(requestId);
  }
}
