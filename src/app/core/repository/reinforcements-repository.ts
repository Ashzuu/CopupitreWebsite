import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { ReinforcementAnnouncement, ReinforcementResponse } from '../model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReinforcementsRepository {
  private readonly client = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  public getAll(): Observable<ReinforcementAnnouncement[]> {
    return this.client.get<ReinforcementAnnouncement[]>(
      this.BASE_API_URL + '/api/reinforcements/all',
    );
  }

  /** Récupère les annonces de renfort des organisations administrées par l'utilisateur connecté. */
  getMyReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.client.get<ReinforcementAnnouncement[]>(
      this.BASE_API_URL + '/api/reinforcements/me',
    );
  }

  /** Récupère les candidatures déposées par l'utilisateur connecté (US-RENF-03). */
  getMyApplications(): Observable<ReinforcementResponse[]> {
    return this.client.get<ReinforcementResponse[]>(
      `${this.BASE_API_URL}/api/reinforcements/my-applications`
    );
  }

  /** Récupère les réponses/candidatures pour une annonce de renfort donnée. */
  getResponsesForAnnouncement(announcementId: number): Observable<ReinforcementResponse[]> {
    return this.client.get<ReinforcementResponse[]>(
      this.BASE_API_URL + '/api/reinforcements/' + announcementId + '/responses',
    );
  }

  /** Crée ou met à jour une annonce de renfort. */
  createAnnouncement(data: any): Observable<ReinforcementAnnouncement> {
    return this.client.post<ReinforcementAnnouncement>(this.BASE_API_URL + '/api/reinforcements/save', data);
  }

  /** Postule à une annonce de renfort (US-RENF-03). */
  applyToAnnouncement(announcementId: number, message?: string): Observable<ReinforcementResponse> {
    return this.client.post<ReinforcementResponse>(
      `${this.BASE_API_URL}/api/reinforcements/${announcementId}/apply`,
      { message: message || '' }
    );
  }

  /** Valide ou refuse une candidature (US-RENF-04). */
  updateApplicationStatus(
    announcementId: number,
    applicationId: number,
    status: 'ACCEPTED' | 'REJECTED'
  ): Observable<ReinforcementResponse> {
    return this.client.patch<ReinforcementResponse>(
      `${this.BASE_API_URL}/api/reinforcements/${announcementId}/applications/${applicationId}/status`,
      { status }
    );
  }

  /** Supprime une annonce de renfort (US-RENF-05). */
  deleteAnnouncement(id: number): Observable<void> {
    return this.client.delete<void>(`${this.BASE_API_URL}/api/reinforcements/${id}`);
  }
}
