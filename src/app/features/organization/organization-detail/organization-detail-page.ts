import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../../core/service/loader-service';
import { BaseLayout } from '../../../layout/base-layout/base-layout';
import { ReinforcementList } from '../../dashboard/components/reinforcement-list/reinforcement-list';
import { ScheduleTable } from '../../dashboard/components/schedule-table/schedule-table';
import { OrganizationDetailService } from './data/organization-detail-service';

@Component({
  selector: 'copupitre-organization-detail-page',
  imports: [BaseLayout, ScheduleTable, ReinforcementList, DatePipe],
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

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.service.loadOrganizationData(parseInt(idParam, 10));
    }
  }
}
