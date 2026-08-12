'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse, AuthorBookListItem } from '@/types/api';
import { BookReviewsManager } from './BookReviewsManager';

export function AuthorReviews() {
  const [bookId, setBookId] = useState<number | null>(null);
  const books = useQuery({ queryKey: ['author', 'books'], queryFn: async () => { const { data } = await apiClient.get<ApiResponse<AuthorBookListItem[]>>('/books/mine'); if (!data.success) throw new Error(data.message); return data.data; } });
  if (books.isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-black/[0.04] dark:bg-white/[0.06]" />;
  if (books.isError || !books.data) return <p className="rounded-2xl bg-rose-400/10 p-4 text-sm text-rose-600">{extractApiErrorMessage(books.error, 'Impossible de charger vos livres.')}</p>;
  return <div className="flex flex-col gap-5"><section className="rounded-2xl border border-black/10 p-5 dark:border-white/15"><h1 className="text-xl font-bold">Avis des lecteurs</h1><p className="mt-1 text-sm text-black/45 dark:text-white/45">Choisissez un livre pour consulter les avis et y répondre.</p><div className="mt-4 flex flex-wrap gap-2">{books.data.map((book) => <button key={book.id} type="button" onClick={() => setBookId(book.id)} className={`rounded-full px-4 py-2 text-sm ${book.id === bookId ? 'bg-brand-amber text-black' : 'border border-black/10 dark:border-white/15'}`}>{book.title}</button>)}</div></section>{bookId !== null && <BookReviewsManager bookId={bookId} />}</div>;
}
