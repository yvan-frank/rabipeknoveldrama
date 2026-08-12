'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpenText } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import { formatPrice } from '@/lib/format-price';
import type { BookSummary } from '@/types/api';

// Couverture de secours quand `cover` est absente ou que l'image ne charge
// pas (URL cassée) — un dégradé de marque + l'initiale du titre plutôt qu'un
// vide disgracieux.
function CoverFallback({ title }: { title: string }) {
  const initial = title.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-amber/25 via-black/5 to-brand-pink/25 dark:from-brand-amber/20 dark:via-white/5 dark:to-brand-pink/20">
      <span aria-hidden className="text-4xl font-bold text-black/15 dark:text-white/15">
        {initial}
      </span>
      <BookOpenText aria-hidden size={20} className="text-black/25 dark:text-white/25" />
    </div>
  );
}

interface BookCardProps {
  book: BookSummary;
  // Facultatif : la liste catalogue standard n'a pas ces stats en une seule
  // requête (cf. listBooks), contrairement à /books/top-rated qui les fournit.
  averageRating?: number;
  reviewCount?: number;
}

export function BookCard({ book, averageRating, reviewCount }: BookCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const displayPrice = book.isPromotion ? book.promotionPrice : book.price;
  const showCover = book.cover && !imageFailed;

  return (
    <Link href={`/livres/${book.slug}`} className="group flex flex-col gap-2.5">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-black/5 shadow-md ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-brand-amber/10 group-hover:ring-brand-amber/30 dark:bg-white/5 dark:ring-white/10">
        {showCover ? (
          <Image
            src={book.cover}
            alt={book.title}
            width={400}
            height={600}
            sizes="(max-width: 768px) 45vw, 200px"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            unoptimized
            onError={() => setImageFailed(true)}
          />
        ) : (
          <CoverFallback title={book.title} />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0 opacity-0 transition duration-300 group-hover:opacity-100" />

        {/* CTA révélée au survol */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-1.5 pb-3 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <BookOpenText size={14} />
          Découvrir
        </div>

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {book.isPromotion && !book.isFree && (
            <span className="rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-2 py-0.5 text-[10px] font-semibold text-black shadow-sm">
              Promo
            </span>
          )}
          {book.isFree && (
            <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur">
              Gratuit
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold transition-colors group-hover:text-brand-amber">
          {book.title}
        </h3>
        <p className="truncate text-xs text-black/50 dark:text-white/50">{book.author.name}</p>
        {averageRating !== undefined && (
          <div className="mt-0.5 flex items-center gap-1">
            <StarRating value={averageRating} size={12} />
            <span className="text-xs text-black/45 dark:text-white/45">
              {averageRating.toFixed(1)}
              {reviewCount !== undefined && ` (${reviewCount})`}
            </span>
          </div>
        )}
        <p className="mt-0.5 text-sm font-semibold">
          {book.isFree ? (
            <span className="text-brand-amber">Gratuit</span>
          ) : (
            <>
              {formatPrice(displayPrice)} FCFA
              {book.isPromotion && (
                <span className="ml-1.5 text-xs font-normal text-black/35 line-through dark:text-white/35">
                  {formatPrice(book.price)} FCFA
                </span>
              )}
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
