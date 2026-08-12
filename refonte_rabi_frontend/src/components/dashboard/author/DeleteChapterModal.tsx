'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ShieldAlert, Trash2, X } from 'lucide-react';
import { extractApiErrorMessage } from '@/lib/api-client';
import type { ChapterSummary } from '@/types/api';

interface DeleteChapterModalProps {
  open: boolean;
  chapter: ChapterSummary | null;
  isSubmitting: boolean;
  error: unknown;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteChapterModal({ open, ...props }: DeleteChapterModalProps) {
  // Le contenu est démonté entre deux ouvertures : le consentement repart de
  // son état initial sans provoquer de rendu en cascade dans un effet.
  if (!open) return null;

  return <DeleteChapterModalContent {...props} />;
}

function DeleteChapterModalContent({ chapter, isSubmitting, error, onClose, onConfirm }: Omit<DeleteChapterModalProps, 'open'>) {
  const [hasConsented, setHasConsented] = useState(false);
  const onCloseRef = useRef(onClose);
  const isSubmittingRef = useRef(isSubmitting);

  useEffect(() => {
    onCloseRef.current = onClose;
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmittingRef.current) onCloseRef.current();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!chapter) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0d0b13]/70 p-3 backdrop-blur-md sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chapter-title"
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-rose-300/25 bg-background shadow-2xl shadow-black/40"
      >
        <div className="absolute -top-28 -right-24 size-64 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute -bottom-36 -left-24 size-64 rounded-full bg-brand-pink/15 blur-3xl" />

        <div className="relative p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-300">
              <ShieldAlert size={24} />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Fermer"
              className="flex size-9 items-center justify-center rounded-full text-black/45 transition hover:bg-black/5 hover:text-black disabled:opacity-40 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mt-6 text-xs font-bold tracking-[0.18em] text-rose-500 uppercase">Action irréversible</p>
          <h2 id="delete-chapter-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Supprimer ce chapitre ?
          </h2>
          <p className="mt-3 text-sm leading-6 text-black/55 dark:text-white/55">
            Le chapitre <span className="font-semibold text-foreground">{chapter.chapterNumber} · « {chapter.title} »</span> sera définitivement retiré du livre.
          </p>

          <button
            type="button"
            aria-pressed={hasConsented}
            onClick={() => setHasConsented((value) => !value)}
            disabled={isSubmitting}
            className={`mt-6 flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm transition disabled:opacity-50 ${
              hasConsented
                ? 'border-rose-400/45 bg-rose-400/10 text-foreground'
                : 'border-black/10 bg-black/[0.025] hover:border-rose-300/40 dark:border-white/10 dark:bg-white/[0.035]'
            }`}
          >
            <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${hasConsented ? 'border-rose-500 bg-rose-500 text-white' : 'border-black/25 dark:border-white/30'}`}>
              {hasConsented && <Check size={14} strokeWidth={3} />}
            </span>
            <span>Je comprends que le contenu de ce chapitre ne pourra pas être récupéré après sa suppression.</span>
          </button>

          {Boolean(error) && <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{extractApiErrorMessage(error, 'La suppression a échoué.')}</p>}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full px-5 py-3 text-sm font-semibold text-black/55 transition hover:bg-black/5 hover:text-foreground disabled:opacity-50 dark:text-white/55 dark:hover:bg-white/10"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!hasConsented || isSubmitting}
              onClick={onConfirm}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={16} />
              {isSubmitting ? 'Suppression…' : 'Supprimer le chapitre'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
