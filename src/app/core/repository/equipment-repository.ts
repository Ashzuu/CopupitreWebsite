import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { EquipmentRequest } from '../model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EquipmentRepository {
  private readonly client = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  public getAllRequests(): Observable<EquipmentRequest[]>{
    return this.client.get<EquipmentRequest[]>(
      this.BASE_API_URL + "/api/equipments/requests/all"
    )
  }
}
