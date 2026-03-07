export const API_URL: string = 'http://localhost:8080/api';

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  id: number;
  username: string;
  role: string;
  message: string;
}
