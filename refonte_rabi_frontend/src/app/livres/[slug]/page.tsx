import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Eye, BookOpenText, ShieldAlert, Tag, Layers3 } from 'lucide-react';
import { ApiNotFoundError, ApiUnavailableError, serverFetch } from '@/lib/api';
import { ApiUnavailableNotice } from '@/components/ApiUnavailableNotice';
import { SetPageTitle } from '@/components/SetPageTitle';
import { LikeButton } from '@/components/reviews/LikeButton';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { AuthorDetailsModal } from '@/components/books/AuthorDetailsModal';
import { AgeGate } from '@/components/books/AgeGate';
import { AddPartToCartButton } from '@/components/books/AddPartToCartButton';
import { formatPrice } from '@/lib/format-price';
import type { BookDetail } from '@/types/api';

const AGE_COOKIE_NAME = 'rabipek_age_confirmed';

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const book = await serverFetch<BookDetail>(`/books/${slug}`);
    const description = book.resume.slice(0, 155);
    const canonical = new URL(`/livres/${book.slug}`, process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rabipeknovel.com').toString();
    return { title: book.title, description, alternates: { canonical }, openGraph: { url: canonical, title: book.title, description, type: 'book', images: [{ url: book.cover, width: 1200, height: 630, alt: `Couverture de ${book.title}` }] }, twitter: { card: 'summary_large_image', title: book.title, description, images: [{ url: book.cover, width: 1200, height: 630, alt: `Couverture de ${book.title}` }] } };
  } catch { return { title: 'Livre indisponible', robots: { index: false, follow: false } }; }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatViewCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace('.0', '')} k`;
  return String(count);
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;

  let book: BookDetail;
  try {
    book = await serverFetch<BookDetail>(`/books/${slug}`, { withAuth: true });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-10">
          <ApiUnavailableNotice message="Ce livre est momentanément indisponible. Réessayez dans un instant." />
        </div>
      );
    }
    if (err instanceof ApiNotFoundError) {
      notFound();
    }
    throw err;
  }

  if (book.isAdultOnly) {
    const cookieStore = await cookies();
    const isAgeConfirmed = cookieStore.get(AGE_COOKIE_NAME)?.value === 'true';
    if (!isAgeConfirmed) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-10">
          <SetPageTitle title={book.title} />
          <AgeGate bookTitle={book.title} />
        </div>
      );
    }
  }

  const displayPrice = book.isPromotion ? book.promotionPrice : book.price;
  const firstChapter = book.chapters[0];
  const hasParts = book.parts.length > 0;
  // Le premier chapitre est toujours accessible tant qu'il y a au moins un
  // chapitre gratuit (ou tout le livre) — l'accès réel aux chapitres suivants
  // est de toute façon vérifié côté serveur (cf. GET /chapters/:id).
  const canReadNow = !hasParts && Boolean(firstChapter) && (book.isFree || book.freeChapterCount > 0);
  const topics = book.extension?.topics
    ? book.extension.topics.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Book', name: book.title, image: book.cover, description: book.resume, author: { '@type': 'Person', name: book.author.name ?? book.author.designation ?? 'Auteur Rabipek' }, aggregateRating: book.reviewCount ? { '@type': 'AggregateRating', ratingValue: book.averageRating, reviewCount: book.reviewCount } : undefined }) }} />
      <SetPageTitle title={book.title} />

      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="relative aspect-[2/3] w-full max-w-[260px] shrink-0 overflow-hidden rounded-2xl bg-black/5 shadow-lg dark:bg-white/5">
          {book.cover ? (
            <Image src={book.cover} alt={book.title} width={260} height={390} sizes="260px" className="h-full w-full object-cover" unoptimized />
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-3 py-1 text-xs font-semibold text-black">
              {book.category.name}
            </span>
            <span className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50">
              <Eye size={14} />
              {formatViewCount(book.viewCount)} vues
            </span>
            {book.isAdultOnly ? (
              <span className="flex items-center gap-1 rounded-full bg-rose-400/15 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
                <ShieldAlert size={12} />
                +18
              </span>
            ) : (
              <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                Tout public
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{book.title}</h1>

          <p className="text-sm text-black/60 dark:text-white/60">
            Par <AuthorDetailsModal author={book.author} bookTitle={book.title} /> · Publié le{' '}
            {formatDate(book.datePub)}
          </p>

          {book.reviewCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <StarRating value={book.averageRating} size={16} />
              <span className="text-black/60 dark:text-white/60">
                {book.averageRating.toFixed(1)} ({book.reviewCount} avis)
              </span>
            </div>
          )}

          <p className="text-lg font-semibold">
            {hasParts ? `${book.parts.length} partie${book.parts.length > 1 ? 's' : ''} à l’achat` : book.isFree ? 'Gratuit' : `${formatPrice(displayPrice)} FCFA`}
            {!hasParts && book.isPromotion && !book.isFree && (
              <span className="ml-2 text-sm text-black/40 line-through dark:text-white/40">
                {formatPrice(book.price)} FCFA
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {canReadNow ? (
              <Link
                href={`/livres/${book.slug}/chapitres/${firstChapter!.chapterNumber}`}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
              >
                <BookOpenText size={16} />
                Commencer la lecture
              </Link>
            ) : !hasParts ? (
              <button
                type="button"
                disabled
                title="L'achat en ligne n'est pas encore disponible"
                className="flex items-center gap-2 rounded-full bg-black/10 px-6 py-2.5 text-sm font-semibold text-black/40 dark:bg-white/10 dark:text-white/40"
              >
                <BookOpenText size={16} />
                Achat bientôt disponible
              </button>
            ) : null}

            <LikeButton bookId={book.id} initialLiked={book.isLikedByUser} initialCount={book.likeCount} />
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed text-black/70 dark:text-white/70">
            {book.resume}
          </p>

          {book.extension?.introduction && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-black/45 uppercase dark:text-white/45">Introduction</p>
              <p className="mt-1 text-sm leading-relaxed text-black/70 dark:text-white/70">{book.extension.introduction}</p>
            </div>
          )}

          {topics.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-black/45 uppercase dark:text-white/45">Sujets abordés</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                  >
                    <Tag size={11} />
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {book.extension?.conclusion && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-black/45 uppercase dark:text-white/45">Conclusion</p>
              <p className="mt-1 text-sm leading-relaxed text-black/70 dark:text-white/70">{book.extension.conclusion}</p>
            </div>
          )}
        </div>
      </div>

      {hasParts && (
        <section className="mt-10 rounded-[2rem] border border-black/8 bg-black/[0.02] p-5 sm:p-7 dark:border-white/8 dark:bg-white/[0.035]">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-amber/15 text-amber-700 dark:text-amber-300"><Layers3 size={21} /></span>
            <div><h2 className="text-xl font-bold">Choisissez votre partie</h2><p className="mt-1 text-sm text-black/50 dark:text-white/50">Chaque partie s’achète indépendamment. Vous ne payez que ce que vous souhaitez lire.</p></div>
          </div>
          <div className="mt-6 grid gap-3">
            {book.parts.map((part) => {
              const firstPartChapter = part.chapters[0];
              const canReadPart = Boolean(firstPartChapter) && (part.isFree || part.freeChapterCount > 0 || part.isPurchased);
              return (
                <article key={part.id} className="rounded-2xl border border-black/8 bg-background p-4 sm:p-5 dark:border-white/8">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0"><p className="text-xs font-bold tracking-[0.16em] text-brand-amber uppercase">Partie {part.partNumber}</p><h3 className="mt-1 text-lg font-semibold">{part.title}</h3>{part.description && <p className="mt-1 text-sm text-black/50 dark:text-white/50">{part.description}</p>}<p className="mt-2 text-xs text-black/45 dark:text-white/45">{part.chapters.length} chapitre{part.chapters.length > 1 ? 's' : ''}{part.freeChapterCount > 0 && ` · ${part.freeChapterCount} chapitre${part.freeChapterCount > 1 ? 's' : ''} en aperçu`}</p></div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end"><span className="rounded-full bg-black/5 px-3 py-1.5 text-sm font-bold dark:bg-white/10">{part.isFree ? 'Gratuite' : `${formatPrice(part.price)} FCFA`}</span>{canReadPart ? <Link href={`/livres/${book.slug}/chapitres/${firstPartChapter!.chapterNumber}`} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-2 text-sm font-semibold text-black"><BookOpenText size={15} />Lire</Link> : <AddPartToCartButton partId={part.id} />}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <ReviewsSection bookId={book.id} initialReviewCount={book.reviewCount} initialAverageRating={book.averageRating} />
    </div>
  );
}
