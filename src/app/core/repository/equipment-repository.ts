import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { EquipmentRequest } from '../model';
import { Observable } from 'rxjs';

/**
 * Repository gérant les appels API pour les demandes de matériel (Epic 04).
 */
@Injectable({
  providedIn: 'root',
})
export class EquipmentRepository {
  private readonly client = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  /** Récupère toutes les demandes de matériel publiques (US-MAT-02). */
  public getAllRequests(): Observable<EquipmentRequest[]> {
    return this.client.get<EquipmentRequest[]>(
      `${this.BASE_API_URL}/api/equipments/requests/all`
    );
  }

  /** Récupère les demandes de matériel des organisations de l'utilisateur connecté (US-MAT-03). */
  public getMyEquipmentRequests(): Observable<EquipmentRequest[]> {
    return this.client.get<EquipmentRequest[]>(
      `${this.BASE_API_URL}/api/equipments/me`
    );
  }

  /** Récupère les demandes de matériel d'une organisation donnée. */
  public getOrganizationEquipmentRequests(orgId: number): Observable<EquipmentRequest[]> {
    return this.client.get<EquipmentRequest[]>(
      `${this.BASE_API_URL}/api/equipments/organization/${orgId}`
    );
  }

  /** Crée ou modifie une demande de matériel (US-MAT-01). */
  public saveRequest(data: Partial<EquipmentRequest>): Observable<EquipmentRequest> {
    return this.client.post<EquipmentRequest>(
      `${this.BASE_API_URL}/api/equipments/save`,
      data
    );
  }

  /** Met à jour le statut d'une demande de matériel (US-MAT-03 / RG-MAT-04). */
  public updateStatus(id: number, status: 'OPEN' | 'MET' | 'CLOSED'): Observable<EquipmentRequest> {
    return this.client.patch<EquipmentRequest>(
      `${this.BASE_API_URL}/api/equipments/${id}/status`,
      { status }
    );
  }

  /** Supprime une demande de matériel (UC-MAT-05 / US-MAT-03). */
  public deleteRequest(id: number): Observable<void> {
    return this.client.delete<void>(
      `${this.BASE_API_URL}/api/equipments/${id}`
    );
  }
}
