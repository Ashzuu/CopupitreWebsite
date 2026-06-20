import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Organization } from '../../../core/model';
import { BaseLayout } from '../../../layout/base-layout/base-layout';

@Component({
  selector: 'copupitre-reinforcement-create-page',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './reinforcement-create-page.html',
  styleUrl: './reinforcement-create-page.scss',
})
export class ReinforcementCreatePage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  /** The userOrganizations property. */
  userOrganizations = signal<Organization[]>([]);

  /** The form property. */
  form = this.fb.group({
    organizationId: ['', Validators.required],
    eventDate: ['', Validators.required],
    location: ['', Validators.required],
    description: ['', Validators.required],
    instruments: this.fb.array([this.createInstrumentGroup()]),
  });

  get instruments() {
    return this.form.get('instruments') as FormArray;
  }

  ngOnInit() {
    this.http.get<Organization[]>('/api/users/me/organizations').subscribe((orgs) => {
      this.userOrganizations.set(orgs);
    });
  }

  /** Executes the createInstrumentGroup action. */
  createInstrumentGroup() {
    return this.fb.group({
      name: ['', Validators.required],
      count: [1, [Validators.required, Validators.min(1)]],
    });
  }

  /** Executes the addInstrument action. */
  addInstrument() {
    this.instruments.push(this.createInstrumentGroup());
  }

  /** Executes the removeInstrument action. */
  removeInstrument(index: number) {
    this.instruments.removeAt(index);
  }

  /** Executes the onSubmit action. */
  onSubmit() {
    if (this.form.valid) {
      this.http.post('/api/reinforcements', this.form.getRawValue()).subscribe(() => {
        alert('Annonce créée avec succès !');
        this.router.navigate(['/renforts']);
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
