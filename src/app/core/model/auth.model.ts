export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface RegisterRequest {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}
