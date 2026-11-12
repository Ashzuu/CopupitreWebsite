import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AssociateMusicianUserRequest,
  CreateMusicianRequest,
  CsvImportResult,
  Musician,
} from '../model/musician';

@Injectable({
  providedIn: 'root',
})
export class MusicianRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  getOrganizationMusicians(orgId: number | string): Observable<Musician[]> {
    return this.http.get<Musician[]>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/musicians`,
    );
  }

  addMusician(orgId: number | string, req: CreateMusicianRequest): Observable<Musician> {
    return this.http.post<Musician>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/musicians`,
      req,
    );
  }

  importCsvFile(orgId: number | string, file: File): Observable<CsvImportResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<CsvImportResult>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/musicians/import-csv`,
      formData,
    );
  }

  removeMusician(orgId: number | string, musicianId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/musicians/${musicianId}`,
    );
  }

  associateUser(orgId: number | string, musicianId: number, email: string): Observable<Musician> {
    const payload: AssociateMusicianUserRequest = { email };
    return this.http.post<Musician>(
      `${this.BASE_API_URL}/api/organizations/${encodeURIComponent(orgId)}/musicians/${musicianId}/associate-user`,
      payload,
    );
  }
}
