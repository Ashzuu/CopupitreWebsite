import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { UserRepository } from '@repositories/user-repository';
import { UpdateProfileRequest, UserProfile } from '@models/user';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly userRepo = inject(UserRepository);
  private readonly authService = inject(AuthService);

  /** Données complètes du profil de l'utilisateur connecté. */
  readonly userProfile = signal<UserProfile | null>(null);

  /** Indicateur de chargement en cours. */
  readonly isLoading = signal<boolean>(false);

  /** Indicateur d'enregistrement en cours. */
  readonly isSaving = signal<boolean>(false);

  /** Nom d'affichage complet du musicien. */
  readonly fullName = computed(() => {
    const profile = this.userProfile();
    if (!profile) return '';
    return `${profile.firstName} ${profile.lastName}`.trim();
  });

  /** Initiales du musicien pour l'avatar. */
  readonly initials = computed(() => {
    const profile = this.userProfile();
    if (!profile) return 'M';
    const first = profile.firstName?.charAt(0) || '';
    const last = profile.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'M';
  });

  /**
   * Charge le profil de l'utilisateur connecté depuis le backend.
   */
  loadProfile(): Observable<UserProfile> {
    this.isLoading.set(true);
    return this.userRepo.getMe().pipe(
      tap({
        next: (profile) => {
          this.userProfile.set(profile);
          this.authService.updateProfileCache(profile);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      }),
    );
  }

  /**
   * Met à jour le profil de l'utilisateur connecté via l'API.
   */
  updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    this.isSaving.set(true);
    return this.userRepo.updateMe(request).pipe(
      tap({
        next: (updated) => {
          this.userProfile.set(updated);
          this.authService.updateProfileCache(updated);
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
        },
      }),
    );
  }
}
