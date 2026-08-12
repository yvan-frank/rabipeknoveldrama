'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookPlus, ChevronRight, Layers, Plus, Trash2 } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse, AuthorBookListItem } from '@/types/api';
import { DeleteBookModal } from './DeleteBookModal';

export function AuthorBooksSection() {
  const queryClient = useQueryClient();
  const [bookToDelete, setBookToDelete] = useState<AuthorBookListItem | null>(null);

  const booksQuery = useQuery({
    queryKey: ['author', 'books'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuthorBookListItem[]>>('/books/mine');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const deleteBook = useMutation({
    mutationFn: async ({ id, confirmationPhrase }: { id: number; confirmationPhrase: string }) => {
      await apiClient.delete(`/books/${id}`, { data: { confirmationPhrase } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author', 'books'] });
      setBookToDelete(null);
    },
  });

  function handleDelete(book: AuthorBookListItem) {
    setBookToDelete(book);
  }

  const books = booksQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Mes livres</h2>
        <Link
          href="/espace-auteur/livres/nouveau"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-2 text-sm font-semibold text-black"
        >
          <Plus size={16} />
          Nouveau livre
        </Link>
      </div>

      {booksQuery.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
      ) : booksQuery.isError ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-600 dark:text-rose-100">
          {extractApiErrorMessage(booksQuery.error, 'Impossible de charger vos livres.')}
        </p>
      ) : books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center dark:border-white/20">
          <p className="text-sm text-black/50 dark:text-white/50">Vous n&apos;avez encore publié aucun livre.</p>
          <Link
            href="/espace-auteur/livres/nouveau"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-black/15 px-5 py-2.5 text-sm font-medium text-black/60 hover:border-brand-amber/40 dark:border-white/20 dark:text-white/60"
          >
            <BookPlus size={18} />
            Publier votre premier livre
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="group flex flex-col gap-3 rounded-2xl border border-black/8 bg-black/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-amber-300/35 dark:border-white/8 dark:bg-white/[0.035]"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-rose-500 text-sm font-bold text-neutral-950">
                  {book.title.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{book.title}</p>
                  <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">{book.category.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-black/50 dark:text-white/50">
                <span className="flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 dark:bg-white/10">
                  <Layers size={12} />
                  {book._count.chapters} chapitre{book._count.chapters > 1 ? 's' : ''}
                </span>
                <span className="rounded-full bg-black/5 px-2 py-1 dark:bg-white/10">
                  {book.isFree ? 'Gratuit' : `${book.price} FCFA`}
                </span>
                {book.isPromotion && (
                  <span className="rounded-full bg-amber-300/20 px-2 py-1 font-medium text-amber-600 dark:text-amber-300">Promo</span>
                )}
              </div>

              <div className="mt-1 flex items-center justify-between">
                <Link
                  href={`/espace-auteur/livres/${book.id}`}
                  className="flex items-center gap-1 text-sm font-medium text-brand-amber hover:underline"
                >
                  Gérer <ChevronRight size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(book)}
                  disabled={deleteBook.isPending}
                  aria-label="Supprimer le livre"
                  className="flex size-8 items-center justify-center rounded-full text-black/40 hover:bg-rose-400/10 hover:text-rose-500 disabled:opacity-50 dark:text-white/40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteBookModal
        open={bookToDelete !== null}
        bookTitle={bookToDelete?.title ?? ''}
        chapterCount={bookToDelete?._count.chapters ?? 0}
        isSubmitting={deleteBook.isPending}
        error={deleteBook.error}
        onClose={() => setBookToDelete(null)}
        onConfirm={(confirmationPhrase) => {
          if (bookToDelete) deleteBook.mutate({ id: bookToDelete.id, confirmationPhrase });
        }}
      />
    </div>
  );
}
