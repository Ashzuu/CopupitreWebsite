export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface RegisterRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  mainInstrument?: string;
  secondaryInstruments?: string;
  musicalDescription?: string;
  yearsOfPractice?: number | null;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}
