'use client';

import { useEffect, useRef } from 'react';
import { Lock, X } from 'lucide-react';
import type { ChapterSummary } from '@/types/api';

interface ChapterListSheetProps {
  open: boolean;
  onClose: () => void;
  chapters: ChapterSummary[];
  currentChapterId: number;
  bookTitle: string;
  onSelect: (chapterNumber: number) => void;
  // Affiche un cadenas sur les chapitres hors de la plage gratuite — purement
  // indicatif, la navigation reste possible : c'est la page de destination
  // qui applique réellement le paywall (cf. GET /chapters/:id côté serveur).
  isBookFree: boolean;
  freeChapterCount: number;
}

// Bottom sheet listant les chapitres du livre, utilisée depuis la page de
// lecture immersive (aucun header/nav disponible pour naviguer autrement).
// Toujours montée (transform/opacity pour l'animation) — au moment où elle
// s'ouvre, on scrolle automatiquement jusqu'au chapitre en cours de lecture.
export function ChapterListSheet({
  open,
  onClose,
  chapters,
  currentChapterId,
  bookTitle,
  onSelect,
  isBookFree,
  freeChapterCount,
}: ChapterListSheetProps) {
  const currentItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    currentItemRef.current?.scrollIntoView({ block: 'center' });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Liste des chapitres"
        className={`fixed inset-x-0 bottom-0 z-[60] flex max-h-[80vh] flex-col rounded-t-3xl border-t border-black/10 bg-background pb-[calc(env(safe-area-inset-bottom)_+_1rem)] shadow-2xl transition-transform duration-300 ease-out dark:border-white/10 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-black/40 uppercase dark:text-white/40">
              Chapitres
            </p>
            <p className="truncate text-lg font-semibold">{bookTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto px-3 pb-4">
          {chapters.map((chapter) => {
            const isCurrent = chapter.id === currentChapterId;
            const isLocked = !isBookFree && chapter.chapterNumber > freeChapterCount;
            return (
              <button
                key={chapter.id}
                ref={isCurrent ? currentItemRef : undefined}
                type="button"
                onClick={() => onSelect(chapter.chapterNumber)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition ${
                  isCurrent
                    ? 'bg-brand-amber/15 font-semibold text-brand-amber'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span className="truncate">
                  Chapitre {chapter.chapterNumber} — {chapter.title}
                </span>
                {isLocked && <Lock size={14} className="shrink-0 text-black/30 dark:text-white/30" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
