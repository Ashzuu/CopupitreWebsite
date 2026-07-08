import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseLayout } from '../../../layout/base-layout/base-layout';
import { NotifService } from '../../../core/service/notif-service';

@Component({
  selector: 'copupitre-organization-create-page',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './organization-create-page.html',
  styleUrl: './organization-create-page.scss',
})
export class OrganizationCreatePage {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private errorService = inject(NotifService);

  /** The form property. */
  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    musicianCount: [null, [Validators.required, Validators.min(1)]],
    regularRehearsals: this.fb.array([]),
    manualRehearsals: this.fb.array([]),
  });

  get regularRehearsals() {
    return this.form.get('regularRehearsals') as FormArray;
  }

  get manualRehearsals() {
    return this.form.get('manualRehearsals') as FormArray;
  }

  /** Executes the createRegularRehearsal action. */
  createRegularRehearsal() {
    return this.fb.group({
      dayOfWeek: ['MONDAY', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      location: ['', Validators.required],
    });
  }

  /** Executes the addRegularRehearsal action. */
  addRegularRehearsal() {
    this.regularRehearsals.push(this.createRegularRehearsal());
  }

  /** Executes the removeRegularRehearsal action. */
  removeRegularRehearsal(index: number) {
    this.regularRehearsals.removeAt(index);
  }

  /** Executes the createManualRehearsal action. */
  createManualRehearsal() {
    return this.fb.group({
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      location: ['', Validators.required],
    });
  }

  /** Executes the addManualRehearsal action. */
  addManualRehearsal() {
    this.manualRehearsals.push(this.createManualRehearsal());
  }

  /** Executes the removeManualRehearsal action. */
  removeManualRehearsal(index: number) {
    this.manualRehearsals.removeAt(index);
  }

  /** Executes the onSubmit action. */
  onSubmit() {
    if (this.form.valid) {
      this.http.post('/api/organizations', this.form.getRawValue()).subscribe(() => {
        this.errorService.showSuccess('Organisation créée avec succès !');
        this.router.navigate(['/']);
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
