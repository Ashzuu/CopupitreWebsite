import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { PermanentAnnouncement } from '@models/permanent-recruitment';
import { ReinforcementResponse } from '@models/reinforcement';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PermanentRecruitmentsRepository {
  private readonly client = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  /** Récupère toutes les annonces de musiciens permanents (besoins annuels de tous les orchestres). */
  public getAll(): Observable<PermanentAnnouncement[]> {
    return this.client.get<PermanentAnnouncement[]>(
      `${this.BASE_API_URL}/api/annual-needs/all`,
    );
  }

  /** Récupère les besoins annuels des organisations administrées par l'utilisateur connecté. */
  public getMyPermanentAnnouncements(): Observable<PermanentAnnouncement[]> {
    return this.client.get<PermanentAnnouncement[]>(
      `${this.BASE_API_URL}/api/annual-needs/me`,
    );
  }

  /** Récupère les candidatures déposées par l'utilisateur connecté aux postes permanents. */
  public getMyApplications(): Observable<ReinforcementResponse[]> {
    return this.client.get<ReinforcementResponse[]>(
      `${this.BASE_API_URL}/api/annual-needs/my-applications`,
    );
  }

  /** Postule à une annonce de musicien permanent (besoin annuel). */
  public applyToAnnouncement(announcementId: number, message?: string): Observable<ReinforcementResponse> {
    return this.client.post<ReinforcementResponse>(
      `${this.BASE_API_URL}/api/annual-needs/${announcementId}/apply`,
      { message: message || '' },
    );
  }

  /** Accepte ou refuse une candidature pour un poste permanent. */
  public updateApplicationStatus(
    announcementId: number,
    applicationId: number,
    status: 'ACCEPTED' | 'REJECTED',
  ): Observable<ReinforcementResponse> {
    return this.client.patch<ReinforcementResponse>(
      `${this.BASE_API_URL}/api/annual-needs/${announcementId}/applications/${applicationId}/status`,
      { status },
    );
  }
}
