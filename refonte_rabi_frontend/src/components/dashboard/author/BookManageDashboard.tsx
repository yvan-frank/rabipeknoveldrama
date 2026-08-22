'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { BookDetailsView } from './BookDetailsView';
import { EditBookModal } from './EditBookModal';
import { ChapterPanel } from './ChapterPanel';
import { DeleteBookModal } from './DeleteBookModal';
import { DeleteChapterModal } from './DeleteChapterModal';
import { BookPartsManager } from './BookPartsManager';
import { BookGrantPanel } from './BookGrantPanel';
import { EpubEditionsPanel } from './EpubEditionsPanel';
import { toBookApiPayload, type BookFormValues, type ChapterFormValues } from '@/lib/schemas/book';
import type { ApiResponse, BookManageDetail, Category, ChapterManageDetail, ChapterSummary } from '@/types/api';

interface BookManageDashboardProps {
  bookId: number;
}

function toBookFormValues(book: BookManageDetail): BookFormValues {
  return {
    title: book.title,
    datePub: book.datePub.slice(0, 10),
    cover: book.cover,
    bookLink: book.bookLink ?? '',
    resume: book.resume,
    price: book.price,
    pageNumber: book.pageNumber,
    categoryId: book.categoryId,
    isFree: book.isFree,
    readBeforePay: book.readBeforePay,
    freeChapterCount: book.freeChapterCount,
    isPromotion: book.isPromotion,
    promotionPrice: book.promotionPrice,
    isAdultOnly: book.isAdultOnly,
    language: book.extension?.language ?? '',
    introduction: book.extension?.introduction ?? '',
    topics: book.extension?.topics ?? '',
    conclusion: book.extension?.conclusion ?? '',
  };
}

export function BookManageDashboard({ bookId }: BookManageDashboardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const bookQuery = useQuery({
    queryKey: ['author', 'book', bookId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<BookManageDetail>>(`/books/manage/${bookId}`);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const updateBook = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { data } = await apiClient.patch<ApiResponse<BookManageDetail>>(`/books/${bookId}`, toBookApiPayload(values));
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (book) => {
      queryClient.setQueryData(['author', 'book', bookId], book);
      queryClient.invalidateQueries({ queryKey: ['author', 'books'] });
      setIsEditModalOpen(false);
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (confirmationPhrase: string) => {
      await apiClient.delete(`/books/${bookId}`, { data: { confirmationPhrase } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author', 'books'] });
      router.push('/espace-auteur/livres');
    },
  });

  function handleDeleteBook() {
    if (!bookQuery.data) return;
    setIsDeleteModalOpen(true);
  }

  if (bookQuery.isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />;
  if (bookQuery.isError || !bookQuery.data) {
    return (
      <p className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-600 dark:text-rose-100">
        {extractApiErrorMessage(bookQuery.error, 'Impossible de charger ce livre.')}
      </p>
    );
  }

  const book = bookQuery.data;
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <Link href="/espace-auteur/livres" className="flex w-fit items-center gap-2 text-sm text-black/60 hover:underline dark:text-white/60">
        <ArrowLeft size={15} />
        Retour à mes livres
      </Link>

      <BookDetailsView
        book={book}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDeleteBook}
        isDeleting={deleteBook.isPending}
      />

      {categoriesQuery.isSuccess && (
        <EditBookModal
          open={isEditModalOpen}
          categories={categories}
          defaultValues={toBookFormValues(book)}
          onSubmit={(values) => updateBook.mutate(values)}
          isSubmitting={updateBook.isPending}
          error={updateBook.error}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      <DeleteBookModal
        open={isDeleteModalOpen}
        bookTitle={book.title}
        chapterCount={book.chapters.length}
        isSubmitting={deleteBook.isPending}
        error={deleteBook.error}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={(confirmationPhrase) => deleteBook.mutate(confirmationPhrase)}
      />

      <BookPartsManager bookId={bookId} parts={book.parts ?? []} />

      <BookGrantPanel bookId={bookId} bookTitle={book.title} />

      <EpubEditionsPanel bookId={bookId} chapterCount={book.chapters.length} />

      <ChaptersManager bookId={bookId} chapters={book.chapters ?? []} parts={book.parts ?? []} />
    </div>
  );
}

function ChaptersManager({ bookId, chapters, parts }: { bookId: number; chapters: ChapterSummary[]; parts: BookManageDetail['parts'] }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<{ type: 'idle' } | { type: 'create' } | { type: 'edit'; id: number }>({ type: 'idle' });
  const [chapterToDelete, setChapterToDelete] = useState<ChapterSummary | null>(null);

  const editingChapterQuery = useQuery({
    queryKey: ['author', 'chapter', mode.type === 'edit' ? mode.id : null],
    queryFn: async () => {
      if (mode.type !== 'edit') return null;
      const { data } = await apiClient.get<ApiResponse<ChapterManageDetail>>(`/chapters/manage/${mode.id}`);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: mode.type === 'edit',
  });

  const invalidateChapters = () => queryClient.invalidateQueries({ queryKey: ['author', 'book', bookId] });

  const createChapter = useMutation({
    mutationFn: async (values: ChapterFormValues) => {
      const { extension, ...rest } = toChapterPayload(values);
      const { data } = await apiClient.post<ApiResponse<{ id: number }>>('/chapters', {
        ...rest,
        bookId,
        ...(extension ? { extension } : {}),
      });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      invalidateChapters();
      setMode({ type: 'idle' });
      try {
        window.localStorage.removeItem(`author-chapter-draft-${bookId}`);
      } catch {
        // rien à faire si l'accès au storage échoue déjà
      }
    },
  });

  const updateChapter = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: ChapterFormValues }) => {
      const { extension, ...rest } = toChapterPayload(values);
      const { data } = await apiClient.patch<ApiResponse<{ id: number }>>(`/chapters/${id}`, {
        ...rest,
        ...(extension ? { extension } : {}),
      });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      invalidateChapters();
      setMode({ type: 'idle' });
    },
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/chapters/${id}`);
    },
    onSuccess: () => {
      invalidateChapters();
      setChapterToDelete(null);
    },
  });

  const assignChapterPart = useMutation({
    mutationFn: async ({ id, partId }: { id: number; partId: number | null }) => {
      const { data } = await apiClient.patch<ApiResponse<ChapterManageDetail>>(`/chapters/${id}`, { partId });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: invalidateChapters,
  });

  function handleDeleteChapter(chapter: ChapterSummary) {
    setChapterToDelete(chapter);
  }

  const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chapitres ({chapters.length})</h2>
        <button
          type="button"
          onClick={() => setMode({ type: 'create' })}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-2 text-sm font-semibold text-black"
        >
          <Plus size={16} />
          Nouveau chapitre
        </button>
      </div>

      <ChapterPanel
        open={mode.type === 'create'}
        title="Nouveau chapitre"
        defaultValues={{ chapterNumber: sortedChapters.length + 1 }}
        onSubmit={(values) => createChapter.mutate(values)}
        isSubmitting={createChapter.isPending}
        submitLabel="Créer le chapitre"
        error={createChapter.error}
        onClose={() => setMode({ type: 'idle' })}
        draftKey={`author-chapter-draft-${bookId}`}
      />

      <ChapterPanel
        open={mode.type === 'edit'}
        title={editingChapterQuery.data ? `Chapitre ${editingChapterQuery.data.chapterNumber} · ${editingChapterQuery.data.title}` : 'Modifier le chapitre'}
        isLoading={editingChapterQuery.isLoading}
        loadError={editingChapterQuery.error}
        defaultValues={
          editingChapterQuery.data
            ? {
                title: editingChapterQuery.data.title,
                chapterNumber: editingChapterQuery.data.chapterNumber,
                content: editingChapterQuery.data.content,
                introduction: editingChapterQuery.data.extension?.introduction ?? '',
              }
            : undefined
        }
        onSubmit={(values) => mode.type === 'edit' && updateChapter.mutate({ id: mode.id, values })}
        isSubmitting={updateChapter.isPending}
        submitLabel="Enregistrer le chapitre"
        error={updateChapter.error}
        onClose={() => setMode({ type: 'idle' })}
      />

      {sortedChapters.length === 0 ? (
        <p className="py-6 text-center text-sm text-black/50 dark:text-white/50">Aucun chapitre pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
          {sortedChapters.map((chapter) => (
            <li key={chapter.id} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0 truncate text-sm">
                <span className="text-black/45 dark:text-white/45">Ch. {chapter.chapterNumber} · </span>
                {chapter.title}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <select
                  value={chapter.partId ?? ''}
                  onChange={(event) => assignChapterPart.mutate({ id: chapter.id, partId: event.target.value ? Number(event.target.value) : null })}
                  disabled={assignChapterPart.isPending}
                  aria-label={`Partie du chapitre ${chapter.title}`}
                  className="max-w-32 rounded-lg border border-black/10 bg-transparent px-2 py-1 text-xs dark:border-white/15"
                >
                  <option value="">Sans partie</option>
                  {parts.map((part) => <option key={part.id} value={part.id}>P. {part.partNumber}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setMode({ type: 'edit', id: chapter.id })}
                  aria-label="Modifier le chapitre"
                  className="flex size-8 items-center justify-center rounded-full text-black/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteChapter(chapter)}
                  disabled={deleteChapter.isPending}
                  aria-label="Supprimer le chapitre"
                  className="flex size-8 items-center justify-center rounded-full text-black/40 hover:bg-rose-400/10 hover:text-rose-500 disabled:opacity-50 dark:text-white/40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DeleteChapterModal
        open={chapterToDelete !== null}
        chapter={chapterToDelete}
        isSubmitting={deleteChapter.isPending}
        error={deleteChapter.error}
        onClose={() => setChapterToDelete(null)}
        onConfirm={() => {
          if (chapterToDelete) deleteChapter.mutate(chapterToDelete.id);
        }}
      />
    </section>
  );
}

function toChapterPayload(values: ChapterFormValues) {
  const { introduction, ...rest } = values;
  return { ...rest, extension: introduction ? { introduction } : undefined };
}
