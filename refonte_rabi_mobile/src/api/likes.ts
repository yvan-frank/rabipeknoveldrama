import { apiClient } from './client';
import type { ApiEnvelope } from './types';

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}

// POST toggle : un like existant est supprimé, sinon créé (cf. likes.service.ts).
export async function toggleBookLike(bookId: number): Promise<ToggleLikeResult> {
  const response = await apiClient.post<ApiEnvelope<ToggleLikeResult>>(`/likes/books/${bookId}`);
  return response.data.data;
}
