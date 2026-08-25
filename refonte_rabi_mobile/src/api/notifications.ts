import { apiClient } from './client';

export async function registerPushToken(token: string): Promise<void> {
  await apiClient.post('/notifications/push-token', { token });
}

export async function unregisterPushToken(token: string): Promise<void> {
  await apiClient.delete('/notifications/push-token', { data: { token } });
}
