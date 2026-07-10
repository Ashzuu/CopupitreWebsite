import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EquipmentRequest } from '@models/equipment-request';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { EquipmentRequestList } from '@pages/dashboard/components/equipment-request-list/equipment-request-list';
import { EquipmentRepository } from '@repositories/equipment-repository';

@Component({
  selector: 'copupitre-equipment-requests-list-page',
  imports: [BaseLayout, EquipmentRequestList, ReactiveFormsModule],
  templateUrl: './equipment-requests-list-page.html',
  styleUrl: './equipment-requests-list-page.scss',
})
export class EquipmentRequestsListPage implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private repository = inject(EquipmentRepository)

  /** The allRequests property. */
  allRequests = signal<EquipmentRequest[]>([]);
  /** The filteredRequests property. */
  filteredRequests = signal<EquipmentRequest[]>([]);

  /** The searchCtrl property. */
  searchCtrl = new FormControl('');

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.repository.getAllRequests().subscribe((data) => {
        this.allRequests.set(data);
        this.filteredRequests.set(data);
      });
    }

    this.searchCtrl.valueChanges.subscribe((term) => {
      if (!term) {
        this.filteredRequests.set(this.allRequests());
      } else {
        const lowerTerm = term.toLowerCase();
        this.filteredRequests.set(
          this.allRequests().filter(
            (r) =>
              r.equipmentName.toLowerCase().includes(lowerTerm) ||
              r.organizationName.toLowerCase().includes(lowerTerm) ||
              r.title.toLowerCase().includes(lowerTerm),
          ),
        );
      }
    });
  }
}
