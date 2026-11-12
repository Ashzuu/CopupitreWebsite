import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Absence,
  AbsenceStats,
  AbsenceStatus,
  CancelEventNotificationRequest,
  CreateAbsenceRequest,
  EventType,
  UpdateAbsenceStatusRequest,
} from '../model/absence';

@Injectable({
  providedIn: 'root',
})
export class AbsenceRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  registerAbsence(orgId: number | string, req: CreateAbsenceRequest): Observable<Absence> {
    return this.http.post<Absence>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/absences`,
      req,
    );
  }

  getAbsences(
    orgId: number | string,
    filters?: {
      startDate?: string;
      endDate?: string;
      eventType?: EventType;
      status?: AbsenceStatus;
      musicianId?: number;
    },
  ): Observable<Absence[]> {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    if (filters?.eventType) params = params.set('eventType', filters.eventType);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.musicianId) params = params.set('musicianId', filters.musicianId.toString());

    return this.http.get<Absence[]>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/absences`,
      { params },
    );
  }

  getStats(orgId: number | string, startDate?: string, endDate?: string): Observable<AbsenceStats[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<AbsenceStats[]>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/absences/stats`,
      { params },
    );
  }

  updateStatus(orgId: number | string, absenceId: number, status: AbsenceStatus): Observable<Absence> {
    const payload: UpdateAbsenceStatusRequest = { status };
    return this.http.patch<Absence>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/absences/${absenceId}/status`,
      payload,
    );
  }

  notifyCancellation(orgId: number | string, req: CancelEventNotificationRequest): Observable<void> {
    return this.http.post<void>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/absences/cancel-event`,
      req,
    );
  }
}
