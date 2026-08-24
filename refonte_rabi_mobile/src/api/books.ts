import { apiClient } from './client';
import type { ApiEnvelope } from './types';

// Miroir de refonte_server/src/modules/books (books.schema.ts / books.service.ts).
export interface AuthorSummary {
  id: number;
  name: string | null;
  designation: string | null;
  image: string | null;
  cover: string | null;
  about: string | null;
}

export interface CategorySummary {
  id: number;
  name: string;
  description: string | null;
}

export interface BookCard {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  price: number;
  isFree: boolean;
  isPromotion: boolean;
  promotionPrice: number | null;
  isAdultOnly: boolean;
  datePub: string;
  category: CategorySummary | null;
  author: AuthorSummary | null;
}

export interface TopRatedBookCard extends Omit<BookCard, 'isAdultOnly'> {
  averageRating: number;
  reviewCount: number;
}

export interface BookListResponse {
  items: BookCard[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BookListQuery {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  search?: string;
  isFree?: boolean;
}

export interface ChapterSummary {
  id: number;
  title: string;
  chapterNumber: number;
  partId: number | null;
}

export interface BookPartSummary {
  id: number;
  title: string;
  partNumber: number;
  description: string | null;
  price: number;
  isFree: boolean;
  freeChapterCount: number;
  isPurchased: boolean;
  chapters: ChapterSummary[];
}

export interface BookDetail extends BookCard {
  resume: string;
  freeChapterCount: number;
  extension: { introduction: string | null; topics: string | null; conclusion: string | null; language: string } | null;
  parts: BookPartSummary[];
  chapters: ChapterSummary[];
  viewCount: number;
  likeCount: number;
  isLikedByUser: boolean;
  reviewCount: number;
  averageRating: number;
}

export async function fetchBooks(query: BookListQuery = {}): Promise<BookListResponse> {
  const response = await apiClient.get<ApiEnvelope<BookListResponse>>('/books', { params: query });
  return response.data.data;
}

export async function fetchTopRatedBooks(limit = 6): Promise<TopRatedBookCard[]> {
  const response = await apiClient.get<ApiEnvelope<TopRatedBookCard[]>>('/books/top-rated', { params: { limit } });
  return response.data.data;
}

export async function fetchBookBySlug(slug: string): Promise<BookDetail> {
  const response = await apiClient.get<ApiEnvelope<BookDetail>>(`/books/${slug}`);
  return response.data.data;
}
