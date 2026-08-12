import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ApiForbiddenError,
  ApiNotFoundError,
  ApiUnauthorizedError,
  ApiUnavailableError,
  serverFetch,
} from '@/lib/api';
import { ChapterReaderClientOnly } from '@/components/reader/ChapterReaderClientOnly';
import { ChapterLockedScreen } from '@/components/reader/ChapterLockedScreen';
import { ApiUnavailableNotice } from '@/components/ApiUnavailableNotice';
import type { BookDetail, ChapterDetail } from '@/types/api';

interface ChapterPageProps {
  params: Promise<{ slug: string; numero: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug, numero } = await params;
  const chapterNumber = Number(numero);

  let book: BookDetail;
  let chapter: ChapterDetail;
  try {
    book = await serverFetch<BookDetail>(`/books/${slug}`);

    const chapterSummary = book.chapters.find((c) => c.chapterNumber === chapterNumber);
    if (!chapterSummary) {
      notFound();
    }

    // withAuth: le paywall (GET /chapters/:id) doit savoir si l'appelant est
    // connecté pour distinguer "connectez-vous" (401) de "achetez" (403).
    chapter = await serverFetch<ChapterDetail>(`/chapters/${chapterSummary.id}`, { withAuth: true });
  } catch (err) {
    if (err instanceof ApiUnauthorizedError) {
      return <ChapterLockedScreen bookSlug={slug} reason="auth" />;
    }
    if (err instanceof ApiForbiddenError) {
      return <ChapterLockedScreen bookSlug={slug} reason="purchase" />;
    }
    if (err instanceof ApiUnavailableError) {
      return (
        <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center gap-6 px-4">
          <ApiUnavailableNotice message="Ce chapitre est momentanément indisponible. Réessayez dans un instant." />
          <Link href={`/livres/${slug}`} className="text-sm underline">
            ← Retour au livre
          </Link>
        </div>
      );
    }
    if (err instanceof ApiNotFoundError) {
      notFound();
    }
    throw err;
  }

  return (
    <ChapterReaderClientOnly
      key={chapter.id}
      chapter={chapter}
      chapters={book.chapters}
      bookSlug={slug}
      bookCover={book.cover}
      isBookFree={book.isFree}
      freeChapterCount={book.freeChapterCount}
    />
  );
}
