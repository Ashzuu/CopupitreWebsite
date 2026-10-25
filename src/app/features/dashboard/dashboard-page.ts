import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoaderService } from '@services/loader-service';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';
import { AuthService } from '@services/auth-service';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { DashboardStatCard } from './components/dashboard-stat-card/dashboard-stat-card';
import { EquipmentRequestList } from './components/equipment-request-list/equipment-request-list';
import { MyAnnouncementsPanel } from './components/my-announcements-panel/my-announcements-panel';
import { ReinforcementList } from './components/reinforcement-list/reinforcement-list';
import { ScheduleTable } from './components/schedule-table/schedule-table';
import { DashboardService } from './data/dashboard-service';
import { EquipmentRequest } from '@models/equipment-request';
import { ReinforcementResponse } from '@models/reinforcement';

@Component({
  selector: 'copupitre-dashboard-page',
  imports: [
    BaseLayout,
    ScheduleTable,
    ReinforcementList,
    EquipmentRequestList,
    MyAnnouncementsPanel,
    DashboardStatCard,
    RouterLink,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  /** The service property. */
  readonly service: DashboardService = inject(DashboardService);
  /** The loaderService property. */
  readonly loaderService: LoaderService = inject(LoaderService);
  readonly authService: AuthService = inject(AuthService);
  private readonly reinforcementRepo: ReinforcementsRepository = inject(ReinforcementsRepository);
  private readonly notifService: NotifService = inject(NotifService);
  private readonly logger: LoggerService = inject(LoggerService);

  /** Candidatures déposées par l'utilisateur connecté */
  readonly userApplications = signal<ReinforcementResponse[]>([]);

  ngOnInit() {
    this.service.loadDashboardData();
    if (this.authService.isAuthenticated()) {
      this.reinforcementRepo.getMyApplications().subscribe({
        next: (apps) => this.userApplications.set(apps || []),
        error: (err) => this.logger.error('Error fetching user applications', 'DashboardPage', err),
      });
    }
  }

  onApplicationApplied(app: ReinforcementResponse) {
    this.userApplications.update((apps) => {
      const index = apps.findIndex((a) => a.id === app.id || a.announcementId === app.announcementId);
      if (index >= 0) {
        const copy = [...apps];
        copy[index] = app;
        return copy;
      }
      return [...apps, app];
    });
  }

  onEquipmentStatusChanged(event: { request: EquipmentRequest; status: 'OPEN' | 'MET' | 'CLOSED' }) {
    this.service.updateEquipmentStatus(event.request.id, event.status).subscribe({
      next: (updated) => {
        this.service.orgBlocks.update((blocks) =>
          blocks.map((b) => ({
            ...b,
            equipmentRequests: b.equipmentRequests.map((r) =>
              r.id === updated.id ? { ...r, status: updated.status } : r
            ),
          }))
        );
        const msg =
          event.status === 'MET'
            ? 'Matériel marqué comme trouvé !'
            : event.status === 'CLOSED'
            ? 'Demande de matériel clôturée.'
            : 'Demande de matériel réouverte.';
        this.notifService.showSuccess(msg);
      },
      error: (err) => {
        this.logger.error('Error updating equipment status', 'DashboardPage', err);
        if (!err?._notificationShown) {
          const message = err?.error?.message || err?.error?.error || 'Impossible de mettre à jour le statut du matériel.';
          this.notifService.showError(message);
        }
      },
    });
  }

  onEquipmentDeleted(request: EquipmentRequest) {
    if (!confirm(`Supprimer la demande de matériel "${request.title}" ?`)) {
      return;
    }

    this.service.deleteEquipmentRequest(request.id).subscribe({
      next: () => {
        this.service.orgBlocks.update((blocks) =>
          blocks.map((b) => ({
            ...b,
            equipmentRequests: b.equipmentRequests.filter((r) => r.id !== request.id),
          }))
        );
        this.notifService.showSuccess('Demande de matériel supprimée.');
      },
      error: (err) => {
        this.logger.error('Error deleting equipment request', 'DashboardPage', err);
        if (!err?._notificationShown) {
          const message = err?.error?.message || err?.error?.error || 'Impossible de supprimer la demande de matériel.';
          this.notifService.showError(message);
        }
      },
    });
  }
}
