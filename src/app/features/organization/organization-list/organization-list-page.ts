import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { Organization } from '@models/organization';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrganizationRepository } from '@repositories/organization-repository';
import { AuthService } from '@services/auth-service';

export interface SizeRangeOption {
  label: string;
  min: number;
  max: number;
  checked: boolean;
}

export interface DayOption {
  label: string;
  value: string;
  checked: boolean;
}

export interface CityOption {
  label: string;
  checked: boolean;
}

@Component({
  selector: 'copupitre-organization-list-page',
  imports: [BaseLayout, RouterLink, FormsModule, TitleCasePipe],
  templateUrl: './organization-list-page.html',
  styleUrl: './organization-list-page.scss',
})
export class OrganizationListPage implements OnInit {
  private readonly repo = inject(OrganizationRepository);
  private readonly platformId = inject(PLATFORM_ID);
  readonly authService = inject(AuthService);

  /** The list of all fetched organizations. */
  readonly allOrganizations = signal<Organization[]>([]);

  // Filters State
  readonly searchName = signal('');
  readonly selectedCities = signal<string[]>([]);
  readonly selectedSizes = signal<string[]>([]);
  readonly selectedDays = signal<string[]>([]);

  // Available options
  readonly sizeOptions = signal<SizeRangeOption[]>([
    { label: '1 - 5', min: 1, max: 5, checked: false },
    { label: '5 - 10', min: 5, max: 10, checked: false },
    { label: '10 - 20', min: 10, max: 20, checked: false },
    { label: '20 - 40', min: 20, max: 40, checked: false },
    { label: '40 - 60', min: 40, max: 60, checked: false },
    { label: '60+', min: 60, max: Infinity, checked: false },
  ]);

  readonly dayOptions = signal<DayOption[]>([
    { label: 'Lundi', value: 'MONDAY', checked: false },
    { label: 'Mardi', value: 'TUESDAY', checked: false },
    { label: 'Mercredi', value: 'WEDNESDAY', checked: false },
    { label: 'Jeudi', value: 'THURSDAY', checked: false },
    { label: 'Vendredi', value: 'FRIDAY', checked: false },
    { label: 'Samedi', value: 'SATURDAY', checked: false },
    { label: 'Dimanche', value: 'SUNDAY', checked: false },
  ]);

  // Cities extracted dynamically from organization list
  readonly cities = computed(() => {
    const list = this.allOrganizations();
    const uniqueCities = Array.from(new Set(list.map((org) => org.city).filter(Boolean)));
    return uniqueCities.sort();
  });

  // Checkbox option lists (UI state helper)
  readonly cityOptions = signal<CityOption[]>([]);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.repo.getAllOrganizations().subscribe((data) => {
        this.allOrganizations.set(data);
        // Initialize city options list
        const cityList = this.cities().map(c => ({ label: c, checked: false }));
        this.cityOptions.set(cityList);
      });
    }
  }

  // Filter computation
  readonly filteredOrganizations = computed(() => {
    let list = this.allOrganizations();

    // 1. Text Search Filter
    const search = this.searchName().toLowerCase().trim();
    if (search) {
      list = list.filter((org) => org.name.toLowerCase().includes(search));
    }

    // 2. City Filter (Multiple selection)
    const activeCities = this.selectedCities();
    if (activeCities.length > 0) {
      list = list.filter((org) => activeCities.includes(org.city));
    }

    // 3. Size Filter (Multiple selection)
    const activeSizes = this.selectedSizes();
    if (activeSizes.length > 0) {
      list = list.filter((org) => {
        const count = org.musicianCount || 0;
        return activeSizes.some((sizeLabel) => {
          const opt = this.sizeOptions().find((o) => o.label === sizeLabel);
          if (!opt) return false;
          return count >= opt.min && count <= opt.max;
        });
      });
    }

    // 4. Rehearsal Day Filter (Multiple selection)
    const activeDays = this.selectedDays();
    if (activeDays.length > 0) {
      list = list.filter((org) => {
        const days = org.rehearsalSchedules?.map((s) => s.dayOfWeek) || [];
        return activeDays.some((day) => days.includes(day as any));
      });
    }

    return list;
  });

  // Action methods
  onCityChange(city: string, checked: boolean) {
    this.cityOptions.update(opts =>
      opts.map(o => o.label === city ? { ...o, checked } : o)
    );
    const active = this.cityOptions().filter(o => o.checked).map(o => o.label);
    this.selectedCities.set(active);
  }

  onSizeChange(label: string, checked: boolean) {
    this.sizeOptions.update(opts =>
      opts.map(o => o.label === label ? { ...o, checked } : o)
    );
    const active = this.sizeOptions().filter(o => o.checked).map(o => o.label);
    this.selectedSizes.set(active);
  }

  onDayChange(value: string, checked: boolean) {
    this.dayOptions.update(opts =>
      opts.map(o => o.value === value ? { ...o, checked } : o)
    );
    const active = this.dayOptions().filter(o => o.checked).map(o => o.value);
    this.selectedDays.set(active);
  }

  resetFilters() {
    this.searchName.set('');
    this.selectedCities.set([]);
    this.selectedSizes.set([]);
    this.selectedDays.set([]);

    this.cityOptions.update(opts => opts.map(o => ({ ...o, checked: false })));
    this.sizeOptions.update(opts => opts.map(o => ({ ...o, checked: false })));
    this.dayOptions.update(opts => opts.map(o => ({ ...o, checked: false })));
  }
}
