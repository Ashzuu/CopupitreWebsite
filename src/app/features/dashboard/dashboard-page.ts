import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoaderService } from '../../core/service/loader-service';
import { BaseLayout } from '../../layout/base-layout/base-layout';
import { DashboardStatCard } from './components/dashboard-stat-card/dashboard-stat-card';
import { EquipmentRequestList } from './components/equipment-request-list/equipment-request-list';
import { MyAnnouncementsPanel } from './components/my-announcements-panel/my-announcements-panel';
import { ReinforcementList } from './components/reinforcement-list/reinforcement-list';
import { ScheduleTable } from './components/schedule-table/schedule-table';
import { DashboardService } from './data/dashboard-service';

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
  readonly service:DashboardService = inject(DashboardService);
  /** The loaderService property. */
  readonly loaderService: LoaderService = inject(LoaderService);

  ngOnInit() {
    this.service.loadDashboardData();
  }
}
