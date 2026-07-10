import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '@models/auth';

export interface UserProfile {
  id?: number;
  username?: string;
  firstName: string;
  lastName: string;
  mainInstrument?: string;
  secondaryInstruments?: string[];
  musicalDescription?: string;
  yearsOfPractice?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly BASE_API_URL = environment.BASE_API_URL;

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE_API_URL}/api/users/me`);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE_API_URL}/api/auth/login`, request);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE_API_URL}/api/auth/register`, request);
  }
}
