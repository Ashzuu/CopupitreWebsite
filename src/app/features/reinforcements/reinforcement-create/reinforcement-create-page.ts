import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Organization } from '@models/index';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';
import { OrganizationRepository } from '@repositories/organization-repository';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';

@Component({
  selector: 'copupitre-reinforcement-create-page',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './reinforcement-create-page.html',
  styleUrl: './reinforcement-create-page.scss',
})
export class ReinforcementCreatePage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private errorService = inject(NotifService);
  private logger = inject(LoggerService);
  private repo = inject(OrganizationRepository);
  private reinforcementRepo = inject(ReinforcementsRepository);

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
    this.repo.getUserOrganizations().subscribe((orgs) => {
      this.userOrganizations.set(orgs);
      if (orgs.length > 0 && !this.form.get('organizationId')?.value) {
        this.form.patchValue({ organizationId: orgs[0].id.toString() });
      }
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
      const rawValue = this.form.getRawValue();
      const orgId = parseInt(rawValue.organizationId || '', 10);
      const eventDate = rawValue.eventDate ? new Date(rawValue.eventDate).toISOString() : null;

      const instrumentsList = rawValue.instruments || [];
      if (instrumentsList.length === 0) {
        this.errorService.showError("Veuillez renseigner au moins un instrument.");
        return;
      }

      // Map the multi-instrument form into separate backend DTO request payloads (RG-RENF-02)
      const requests = instrumentsList.map((inst: any) => {
        const payload = {
          organizationId: orgId,
          eventDate: eventDate,
          eventLocation: rawValue.location,
          description: rawValue.description,
          instrumentNeeded: inst.name,
          requiredQuantity: inst.count,
          title: `Besoin de renfort - ${inst.name}`
        };
        return this.reinforcementRepo.createAnnouncement(payload);
      });

      forkJoin(requests).subscribe({
        next: () => {
          this.errorService.showSuccess('Annonces de renfort créées avec succès !');
          this.router.navigate(['/renforts']);
        },
        error: (err) => {
          this.logger.error('Error saving reinforcement requests', 'ReinforcementCreatePage', err);
          if (!err?._notificationShown) {
            const msg = err?.error?.message || err?.error?.error || "Impossible de publier l'annonce de renfort.";
            this.errorService.showError(msg);
          }
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
