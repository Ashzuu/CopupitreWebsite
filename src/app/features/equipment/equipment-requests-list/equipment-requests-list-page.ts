import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EquipmentRequest } from '../../../core/model';
import { BaseLayout } from '../../../layout/base-layout/base-layout';
import { EquipmentRequestList } from '../../dashboard/components/equipment-request-list/equipment-request-list';

@Component({
  selector: 'copupitre-equipment-requests-list-page',
  imports: [BaseLayout, EquipmentRequestList, ReactiveFormsModule],
  templateUrl: './equipment-requests-list-page.html',
  styleUrl: './equipment-requests-list-page.scss',
})
export class EquipmentRequestsListPage implements OnInit {
  private http = inject(HttpClient);

  /** The allRequests property. */
  allRequests = signal<EquipmentRequest[]>([]);
  /** The filteredRequests property. */
  filteredRequests = signal<EquipmentRequest[]>([]);

  /** The searchCtrl property. */
  searchCtrl = new FormControl('');

  ngOnInit() {
    this.http.get<EquipmentRequest[]>('/api/equipment-requests').subscribe((data) => {
      this.allRequests.set(data);
      this.filteredRequests.set(data);
    });

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
