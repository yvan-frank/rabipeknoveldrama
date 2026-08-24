import { apiClient } from './client';
import type { ApiEnvelope } from './types';

// Miroir de refonte_server/src/modules/comments (comments.service.ts).
export interface ReviewReply {
  id: number;
  content: string;
  createdAt: string;
}

export interface Review {
  id: number;
  message: string;
  rating: number;
  createdAt: string;
  user: { id: number; name: string | null };
  replies?: ReviewReply[];
}

export async function fetchBookReviews(bookId: number): Promise<Review[]> {
  const response = await apiClient.get<ApiEnvelope<Review[]>>(`/comments/book/${bookId}`);
  return response.data.data;
}

// POST fait un upsert côté serveur : un second envoi remplace l'avis
// existant (rating+message) au lieu d'en créer un doublon — un seul avis par
// lecteur et par livre.
export async function submitBookReview(bookId: number, rating: number, message: string): Promise<Review> {
  const response = await apiClient.post<ApiEnvelope<Review>>(`/comments/book/${bookId}`, { rating, message });
  return response.data.data;
}

export interface ChapterCommentItem {
  id: number;
  content: string;
  parentId: number | null;
  createdAt: string;
  user: { id: number; name: string | null };
}

export async function fetchChapterComments(chapterId: number): Promise<ChapterCommentItem[]> {
  const response = await apiClient.get<ApiEnvelope<ChapterCommentItem[]>>(`/comments/chapter/${chapterId}`);
  return response.data.data;
}

export async function submitChapterComment(chapterId: number, content: string, parentId?: number): Promise<ChapterCommentItem> {
  const response = await apiClient.post<ApiEnvelope<ChapterCommentItem>>(`/comments/chapter/${chapterId}`, { content, parentId });
  return response.data.data;
}

// Seul l'auteur du commentaire peut le supprimer (vérifié côté serveur,
// cf. comments.service.ts) — supprime aussi ses réponses (cascade en base).
export async function deleteChapterComment(commentId: number): Promise<void> {
  await apiClient.delete(`/comments/chapter-comment/${commentId}`);
}
