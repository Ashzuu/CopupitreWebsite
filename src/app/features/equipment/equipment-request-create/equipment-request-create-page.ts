import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Organization } from '@models/index';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { NotifService } from '@services/notif-service';
import { OrganizationRepository } from '@repositories/organization-repository';

@Component({
  selector: 'copupitre-equipment-request-create-page',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './equipment-request-create-page.html',
  styleUrl: './equipment-request-create-page.scss',
})
export class EquipmentRequestCreatePage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private errorService = inject(NotifService);
  private repo = inject(OrganizationRepository);

  /** The organizations property. */
  organizations: Organization[] = [];

  /** The form property. */
  form = this.fb.group({
    organizationId: [null, Validators.required],
    title: ['', Validators.required],
    equipmentName: ['', Validators.required],
    duration: ['', Validators.required],
    description: [''],
    eventDates: [''],
  });

  ngOnInit() {
    this.repo.getUserOrganizations().subscribe((orgs) => {
      this.organizations = orgs;
      if (orgs.length > 0) {
        this.form.patchValue({ organizationId: orgs[0].id as any });
      }
    });
  }

  /** Executes the onSubmit action. */
  onSubmit() {
    if (this.form.valid) {
      this.http.post('/api/equipment-requests', this.form.getRawValue()).subscribe(() => {
        this.errorService.showSuccess('Demande de matériel créée avec succès !');
        this.router.navigate(['/dashboard']);
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
