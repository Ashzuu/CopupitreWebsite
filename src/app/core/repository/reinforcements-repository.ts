import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ReinforcementAnnouncement, ReinforcementResponse } from '../model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReinforcementsRepository {
  private readonly client = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  public getAll() {
    return this.client.get<ReinforcementAnnouncement[]>(
      this.BASE_API_URL + '/api/reinforcements/all',
    );
  }

  /** Executes the getMyReinforcementAnnouncements action. */
  getMyReinforcementAnnouncements(): Observable<ReinforcementAnnouncement[]> {
    return this.client.get<ReinforcementAnnouncement[]>(
      this.BASE_API_URL + '/api/reinforcements/me',
    );
  }

  /** Executes the getResponsesForAnnouncement action. */
  getResponsesForAnnouncement(announcementId: number): Observable<ReinforcementResponse[]> {
    return this.client.get<ReinforcementResponse[]>(
      this.BASE_API_URL + '/api/reinforcements/' + announcementId + '/responses',
    );
  }

  createAnnouncement(data:any){
    return this.client.post(this.BASE_API_URL + '/api/reinforcements/save', data);
  }

  deleteAnnouncement(id: number) {
    return this.client.delete(`${this.BASE_API_URL}/api/reinforcements/${id}`);
  }
}