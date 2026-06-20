import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReinforcementAnnouncement } from '../../../core/model';
import { BaseLayout } from '../../../layout/base-layout/base-layout';
import { ReinforcementList } from '../../dashboard/components/reinforcement-list/reinforcement-list';

@Component({
  selector: 'copupitre-reinforcements-list-page',
  imports: [BaseLayout, ReinforcementList, FormsModule],
  templateUrl: './reinforcements-list-page.html',
  styleUrl: './reinforcements-list-page.scss',
})
export class ReinforcementsListPage implements OnInit {
  private http = inject(HttpClient);

  /** The announcements property. */
  announcements = signal<ReinforcementAnnouncement[]>([]);

  /** The filterCity property. */
  filterCity = signal('');
  /** The filterOrg property. */
  filterOrg = signal('');
  /** The filterDate property. */
  filterDate = signal('');

  /** The filteredAnnouncements property. */
  filteredAnnouncements = computed(() => {
    return this.announcements().filter((a) => {
      const matchCity =
        !this.filterCity() || a.location.toLowerCase().includes(this.filterCity().toLowerCase());
      const matchOrg =
        !this.filterOrg() ||
        a.organizationName.toLowerCase().includes(this.filterOrg().toLowerCase());
      const matchDate = !this.filterDate() || a.eventDate.startsWith(this.filterDate());
      return matchCity && matchOrg && matchDate;
    });
  });

  ngOnInit() {
    this.http.get<ReinforcementAnnouncement[]>('/api/reinforcements/all').subscribe((data) => {
      this.announcements.set(data);
    });
  }
}
