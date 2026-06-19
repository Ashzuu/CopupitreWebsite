import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Organization } from '../../core/model';
import { BaseLayout } from '../../layout/base-layout/base-layout';

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
    this.http.get<Organization[]>('/api/users/me/organizations').subscribe((orgs) => {
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
        alert('Demande de matériel créée avec succès !');
        this.router.navigate(['/dashboard']);
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
