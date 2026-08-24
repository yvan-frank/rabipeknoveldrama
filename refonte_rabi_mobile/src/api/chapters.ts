import { apiClient } from './client';
import type { ApiEnvelope } from './types';

// Miroir de refonte_server/src/modules/chapters/chapters.service.ts (getChapterForViewer).
export interface ChapterDetail {
  id: number;
  title: string;
  content: string; // HTML déchiffré côté serveur
  chapterNumber: number;
  bookId: number;
  partId: number | null;
  book: { id: number; title: string; authorId: number; isFree: boolean; freeChapterCount: number };
  part: { id: number; title: string; partNumber: number; isFree: boolean; freeChapterCount: number; price: number } | null;
}

export async function fetchChapter(chapterId: number): Promise<ChapterDetail> {
  const response = await apiClient.get<ApiEnvelope<ChapterDetail>>(`/chapters/${chapterId}`);
  return response.data.data;
}

export interface ReadingProgress {
  chapterRead: number;
  progressPercent: number;
  readAt: string;
}

export async function fetchReadingProgress(bookId: number): Promise<ReadingProgress | null> {
  const response = await apiClient.get<ApiEnvelope<ReadingProgress | null>>(`/books/${bookId}/reading-progress`);
  return response.data.data;
}

export async function saveReadingProgress(bookId: number, chapterNumber: number, progressPercent: number): Promise<void> {
  await apiClient.put(`/books/${bookId}/reading-progress`, { chapterNumber, progressPercent });
}
