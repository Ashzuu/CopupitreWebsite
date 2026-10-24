import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { UpdateProfileRequest, UserProfile } from '@models/user';

@Injectable({
  providedIn: 'root',
})
export class UserRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  /**
   * Récupère les données de profil du musicien actuellement connecté.
   */
  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE_API_URL}/api/users/me`);
  }

  /**
   * Met à jour le profil musical et personnel du musicien connecté.
   */
  updateMe(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.BASE_API_URL}/api/users/me`, request);
  }
}
