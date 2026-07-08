import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoaderService } from '../../../core/service/loader-service';
import { BaseLayout } from '../../../layout/base-layout/base-layout';
import { ReinforcementList } from '../../dashboard/components/reinforcement-list/reinforcement-list';
import { ScheduleTable } from '../../dashboard/components/schedule-table/schedule-table';
import { OrganizationDetailService } from './data/organization-detail-service';
import { AuthService } from '../../../core/service/auth-service';

@Component({
  selector: 'copupitre-organization-detail-page',
  imports: [BaseLayout, ScheduleTable, ReinforcementList, DatePipe, RouterLink],
  providers: [OrganizationDetailService],
  templateUrl: './organization-detail-page.html',
  styleUrl: './organization-detail-page.scss',
})
export class OrganizationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  /** The service property. */
  readonly service = inject(OrganizationDetailService);
  /** The loaderService property. */
  readonly loaderService = inject(LoaderService);
  readonly authService = inject(AuthService);

  readonly isAdmin = computed(() => {
    const org = this.service.organization();
    if (!org) return false;
    const fullName = this.authService.currentUserFullName();
    if (!fullName) return false;
    return org.adminUsernames?.includes(fullName) ?? false;
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.service.loadOrganizationData(parseInt(idParam, 10));
    }
  }
}
