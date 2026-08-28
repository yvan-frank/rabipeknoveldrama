import { apiClient } from './client';
import type { ApiEnvelope, AuthResponse } from './types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/login', payload);
  return response.data.data;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/register', payload);
  return response.data.data;
}

export async function googleLoginRequest(idToken: string): Promise<AuthResponse> {
  const response = await apiClient.post<ApiEnvelope<AuthResponse>>('/auth/google', { idToken });
  return response.data.data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}
