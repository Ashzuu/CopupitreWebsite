import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Organization } from '@models/index';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { NotifService } from '@services/notif-service';
import { OrganizationRepository } from '@repositories/organization-repository';
import { EquipmentRepository } from '@repositories/equipment-repository';

@Component({
  selector: 'copupitre-equipment-request-create-page',
  imports: [BaseLayout, ReactiveFormsModule, RouterLink],
  templateUrl: './equipment-request-create-page.html',
  styleUrl: './equipment-request-create-page.scss',
})
export class EquipmentRequestCreatePage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notifService = inject(NotifService);
  private orgRepo = inject(OrganizationRepository);
  private equipmentRepo = inject(EquipmentRepository);

  /** Liste des organisations administrées par l'utilisateur connecté */
  organizations = signal<Organization[]>([]);
  /** Indicateur de soumission en cours */
  isSubmitting = signal<boolean>(false);

  /** Formulaire réactif de création de demande */
  form = this.fb.group({
    organizationId: [null as number | null, [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(3)]],
    equipmentName: ['', [Validators.required, Validators.minLength(2)]],
    duration: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    eventDates: [''],
  });

  ngOnInit() {
    this.orgRepo.getUserOrganizations().subscribe({
      next: (orgs) => {
        this.organizations.set(orgs || []);
        if (orgs && orgs.length > 0) {
          this.form.patchValue({ organizationId: orgs[0].id });
        }
      },
      error: (err) => {
        console.error('[EquipmentRequestCreatePage] Erreur chargement organisations:', err);
      },
    });
  }

  /**
   * Parse et normalise les dates saisies par l'utilisateur au format ISO (YYYY-MM-DD).
   * Accepte les formats : "2026-11-15", "15/11/2026", "2026-11-15, 2026-11-18".
   */
  parseDateStrings(input: string): string[] {
    if (!input || !input.trim()) return [];

    return input
      .split(/[,;\n]+/)
      .map((d) => d.trim())
      .filter((d) => d.length > 0)
      .map((rawDate) => {
        // Format DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
          const [day, month, year] = rawDate.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Format YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          return rawDate;
        }
        return rawDate;
      });
  }

  /** Soumet la demande de matériel */
  onSubmit() {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const eventDates = this.parseDateStrings(raw.eventDates || '');

    const payload = {
      organizationId: Number(raw.organizationId),
      title: raw.title!.trim(),
      equipmentName: raw.equipmentName!.trim(),
      duration: raw.duration!.trim(),
      description: raw.description ? raw.description.trim() : '',
      eventDates,
      status: 'OPEN' as const,
    };

    this.isSubmitting.set(true);

    this.equipmentRepo.saveRequest(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notifService.showSuccess('Demande de matériel publiée avec succès !');
        this.router.navigate(['/materiels']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('[EquipmentRequestCreatePage] Erreur enregistrement matériel:', err);
        if (!err?._notificationShown) {
          const message =
            err?.error?.message ||
            err?.error?.error ||
            'Impossible de créer la demande de matériel.';
          this.notifService.showError(message);
        }
      },
    });
  }
}
