import { apiClient } from './client';
import type { ApiEnvelope } from './types';

export type SupportSender = 'user' | 'admin';

export interface SupportMessage {
  id: number;
  sender: SupportSender;
  content: string;
  createdAt: string;
}

export async function getMyMessages(): Promise<SupportMessage[]> {
  const response = await apiClient.get<ApiEnvelope<{ messages: SupportMessage[] }>>('/support/messages');
  return response.data.data.messages;
}

export async function getUnreadSupportCount(): Promise<number> {
  const response = await apiClient.get<ApiEnvelope<{ unreadCount: number }>>('/support/messages/unread-count');
  return response.data.data.unreadCount;
}

export async function sendSupportMessage(content: string): Promise<SupportMessage> {
  const response = await apiClient.post<ApiEnvelope<SupportMessage>>('/support/messages', { content });
  return response.data.data;
}
