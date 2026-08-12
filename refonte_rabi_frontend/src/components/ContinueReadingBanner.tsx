'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useHeaderVisibility } from '@/hooks/useHeaderVisibility';
import { useContinueReading } from '@/hooks/useContinueReading';

// Bandeau "reprendre la lecture" affiché sur les pages publiques (jamais
// pendant la lecture elle-même : ce composant n'est monté que dans la
// branche non-immersive de SiteChrome, qui exclut déjà les routes de
// lecture). Se cache/réapparaît selon le sens du scroll, comme le header.
export function ContinueReadingBanner() {
  const isScrollVisible = useHeaderVisibility();
  const entry = useContinueReading();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!entry || isDismissed) return null;

  const progress = entry.totalChapters > 0 ? Math.min(100, Math.round((entry.chapterNumber / entry.totalChapters) * 100)) : 0;
  const href = `/livres/${entry.bookSlug}/chapitres/${entry.chapterNumber}`;

  return (
    <div
      className={`fixed inset-x-0 bottom-16 z-40 px-4 transition-transform duration-300 sm:bottom-4 ${
        isScrollVisible ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]'
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-black/10 bg-background/95 p-3 shadow-2xl backdrop-blur-lg dark:border-white/10">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/10">
          {entry.bookCover ? (
            <Image src={entry.bookCover} alt={entry.bookTitle} width={48} height={48} sizes="48px" className="h-full w-full object-cover" unoptimized />
          ) : (
            <div className="flex size-full items-center justify-center">
              <BookOpen size={18} className="text-black/30 dark:text-white/30" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{entry.bookTitle}</p>
          <p className="text-xs text-black/50 dark:text-white/50">
            Chapitre {entry.chapterNumber} sur {entry.totalChapters}
          </p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-amber to-brand-pink" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Link
          href={href}
          className="shrink-0 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-2 text-xs font-semibold text-black"
        >
          Continuer
        </Link>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="Fermer"
          className="shrink-0 text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
