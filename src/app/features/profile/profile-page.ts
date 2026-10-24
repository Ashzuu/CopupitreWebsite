import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { UpdateProfileRequest, UserProfile } from '@models/user';
import { NotifService } from '@services/notif-service';
import { UserService } from '@services/user-service';
import { AuthService } from '@services/auth-service';

@Component({
  selector: 'copupitre-profile-page',
  imports: [BaseLayout, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly userService = inject(UserService);
  readonly authService = inject(AuthService);
  private readonly notifService = inject(NotifService);

  /** Mode édition activé ou non. */
  readonly isEditing = signal<boolean>(false);

  /** Profil utilisateur actif depuis UserService. */
  readonly profile = computed(() => this.userService.userProfile());
  readonly isLoading = computed(() => this.userService.isLoading());
  readonly isSaving = computed(() => this.userService.isSaving());
  readonly initials = computed(() => this.userService.initials());

  /** Liste des instruments secondaires sous forme de tableau. */
  readonly secondaryInstrumentsList = computed(() => {
    const p = this.profile();
    return p?.secondaryInstruments ?? [];
  });

  /** Formulaire réactif pour la modification du profil. */
  readonly profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    mainInstrument: ['', [Validators.required, Validators.maxLength(50)]],
    secondaryInstruments: ['', [Validators.maxLength(200)]],
    yearsOfPractice: [null as number | null, [Validators.min(0), Validators.max(100)]],
    musicalDescription: ['', [Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.userService.loadProfile().subscribe({
      next: (profile) => {
        this.populateForm(profile);
      },
      error: () => {
        this.notifService.showError('Impossible de charger les données de votre profil.');
      },
    });
  }

  /**
   * Pré-remplit le formulaire réactif avec les données reçues.
   */
  private populateForm(profile: UserProfile): void {
    const secondaryStr = profile.secondaryInstruments && Array.isArray(profile.secondaryInstruments)
      ? profile.secondaryInstruments.join(', ')
      : '';

    this.profileForm.patchValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      mainInstrument: profile.mainInstrument || '',
      secondaryInstruments: secondaryStr,
      yearsOfPractice: profile.yearsOfPractice ?? null,
      musicalDescription: profile.musicalDescription || '',
    });
  }

  /**
   * Active le mode édition du profil.
   */
  enableEdit(): void {
    const current = this.profile();
    if (current) {
      this.populateForm(current);
    }
    this.isEditing.set(true);
  }

  /**
   * Annule le mode édition et restaure les valeurs sauvegardées.
   */
  cancelEdit(): void {
    const current = this.profile();
    if (current) {
      this.populateForm(current);
    }
    this.isEditing.set(false);
  }

  /**
   * Soumet les modifications apportées au profil.
   */
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.notifService.showWarning('Veuillez corriger les erreurs dans le formulaire avant de valider.');
      return;
    }

    const formValues = this.profileForm.getRawValue();

    // Découpage des instruments secondaires séparés par une virgule
    const secondaryArray = formValues.secondaryInstruments
      ? formValues.secondaryInstruments
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

    const request: UpdateProfileRequest = {
      firstName: formValues.firstName?.trim() || '',
      lastName: formValues.lastName?.trim() || '',
      mainInstrument: formValues.mainInstrument?.trim() || '',
      secondaryInstruments: secondaryArray,
      yearsOfPractice: formValues.yearsOfPractice ?? null,
      musicalDescription: formValues.musicalDescription?.trim() || '',
    };

    this.userService.updateProfile(request).subscribe({
      next: (updatedProfile) => {
        this.populateForm(updatedProfile);
        this.isEditing.set(false);
        this.notifService.showSuccess('Votre profil musical a été mis à jour avec succès.');
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Erreur lors de la mise à jour de votre profil.';
        this.notifService.showError(errorMsg);
      },
    });
  }
}
