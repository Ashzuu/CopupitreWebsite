import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseLayout } from '../../../layout/base-layout/base-layout';
import { NotifService } from '../../../core/service/notif-service';
import { environment } from '../../../../environments/environment';
import { OrganizationRepository } from '../../../core/repository/organization-repository';
import { Organization } from '../../../core/model';

@Component({
  selector: 'copupitre-organization-create-page',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './organization-create-page.html',
  styleUrl: './organization-create-page.scss',
})
export class OrganizationCreatePage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orgRepo = inject(OrganizationRepository);
  private errorService = inject(NotifService);

  isEditMode = false;
  orgId: number | null = null;

  /** The form property. */
  form = this.fb.group({
    id: [null as number | null],
    name: ['', Validators.required],
    city: ['', Validators.required],
    musicianCount: [null as number | null, [Validators.required, Validators.min(1)]],
    formationType: [''],
    description: ['', Validators.required],
    concertDress: [''],
    logisticsInfo: [''],
    rehearsalAddress: [''],
    rehearsalSchedule: [''],
    rehearsalSchedules: this.fb.array([]),
    rehearsalManuals: this.fb.array([]),
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.orgId = parseInt(idParam, 10);
      this.loadOrganization(this.orgId);
    }
  }

  loadOrganization(id: number) {
    this.orgRepo.getById(id).subscribe({
      next: (org) => {
        this.patchForm(org);
      },
      error: (err) => {
        this.errorService.showError("Impossible de charger les informations de l'organisation.");
        this.router.navigate(['/dashboard']);
      }
    });
  }

  patchForm(org: Organization) {
    this.form.patchValue({
      id: org.id,
      name: org.name,
      city: org.city,
      musicianCount: org.musicianCount ?? null,
      formationType: org.formationType ?? '',
      description: org.description,
      concertDress: org.concertDress ?? '',
      logisticsInfo: org.logisticsInfo ?? '',
      rehearsalAddress: org.rehearsalAddress ?? '',
      rehearsalSchedule: org.rehearsalSchedule ?? '',
    });

    // Populate schedules FormArray
    this.rehearsalSchedules.clear();
    if (org.rehearsalSchedules) {
      org.rehearsalSchedules.forEach((s) => {
        this.rehearsalSchedules.push(
          this.fb.group({
            id: [s.id],
            dayOfWeek: [s.dayOfWeek, Validators.required],
            startTime: [s.startTime, [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
            endTime: [s.endTime, [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
            location: [s.location, Validators.required],
          })
        );
      });
    }

    // Populate manual rehearsals FormArray
    this.rehearsalManuals.clear();
    if (org.rehearsalManuals) {
      org.rehearsalManuals.forEach((m) => {
        this.rehearsalManuals.push(
          this.fb.group({
            id: [m.id],
            manualDate: [m.manualDate, Validators.required],
            startTime: [m.startTime, [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
            endTime: [m.endTime, [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
            location: [m.location, Validators.required],
          })
        );
      });
    }
  }

  get rehearsalSchedules() {
    return this.form.get('rehearsalSchedules') as FormArray;
  }

  get rehearsalManuals() {
    return this.form.get('rehearsalManuals') as FormArray;
  }

  /** Executes the createRehearsalSchedule action. */
  createRehearsalSchedule() {
    return this.fb.group({
      id: [null as number | null],
      dayOfWeek: ['MONDAY', Validators.required],
      startTime: ['', [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: ['', [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
      location: ['', Validators.required],
    });
  }

  /** Executes the addRehearsalSchedule action. */
  addRehearsalSchedule() {
    this.rehearsalSchedules.push(this.createRehearsalSchedule());
  }

  /** Executes the removeRehearsalSchedule action. */
  removeRehearsalSchedule(index: number) {
    this.rehearsalSchedules.removeAt(index);
  }

  /** Executes the createRehearsalManual action. */
  createRehearsalManual() {
    return this.fb.group({
      id: [null as number | null],
      manualDate: ['', Validators.required],
      startTime: ['', [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: ['', [Validators.required, Validators.pattern(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]],
      location: ['', Validators.required],
    });
  }

  /** Executes the addRehearsalManual action. */
  addRehearsalManual() {
    this.rehearsalManuals.push(this.createRehearsalManual());
  }

  /** Executes the removeRehearsalManual action. */
  removeRehearsalManual(index: number) {
    this.rehearsalManuals.removeAt(index);
  }

  /** Executes the onSubmit action. */
  onSubmit() {
    if (this.form.valid) {
      this.http.post(`${environment.BASE_API_URL}/api/organizations/save`, this.form.getRawValue()).subscribe(() => {
        this.errorService.showSuccess(this.isEditMode ? 'Organisation modifiée avec succès !' : 'Organisation créée avec succès !');
        this.router.navigate(['/dashboard']);
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
