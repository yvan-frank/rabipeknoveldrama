'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ShieldAlert, Trash2, X } from 'lucide-react';
import { extractApiErrorMessage } from '@/lib/api-client';

const CONFIRMATION_PHRASE = 'SUPPRIMER';

interface DeleteBookModalProps {
  open: boolean;
  bookTitle: string;
  chapterCount: number;
  isSubmitting: boolean;
  error: unknown;
  onClose: () => void;
  onConfirm: (confirmationPhrase: string) => void;
}

export function DeleteBookModal({
  open,
  ...props
}: DeleteBookModalProps) {
  // Le contenu est démonté entre deux ouvertures : les contrôles reviennent
  // naturellement à leur état initial sans mise à jour d'état dans un effet.
  if (!open) return null;

  return <DeleteBookModalContent {...props} />;
}

function DeleteBookModalContent({
  bookTitle,
  chapterCount,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: Omit<DeleteBookModalProps, 'open'>) {
  const [hasConsented, setHasConsented] = useState(false);
  const [phrase, setPhrase] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  const isSubmittingRef = useRef(isSubmitting);
  const isReady = hasConsented && phrase === CONFIRMATION_PHRASE;

  useEffect(() => {
    onCloseRef.current = onClose;
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting, onClose]);

  useEffect(() => {
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmittingRef.current) onCloseRef.current();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

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
        aria-labelledby="delete-book-title"
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

          <p className="mt-6 text-xs font-bold tracking-[0.18em] text-rose-500 uppercase">Zone sensible</p>
          <h2 id="delete-book-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Supprimer ce livre ?
          </h2>
          <p className="mt-3 text-sm leading-6 text-black/55 dark:text-white/55">
            Vous êtes sur le point de retirer <span className="font-semibold text-foreground">« {bookTitle} »</span>
            {chapterCount > 0 && ` et ses ${chapterCount} chapitre${chapterCount > 1 ? 's' : ''}`}. Cette action est irréversible.
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
            <span>Je comprends que cette suppression est définitive et que le contenu ne pourra pas être récupéré.</span>
          </button>

          <label className="mt-5 block">
            <span className="text-sm font-semibold">Phrase de confirmation</span>
            <span className="mt-1 block text-xs text-black/45 dark:text-white/45">
              Saisissez <strong className="font-bold text-foreground">{CONFIRMATION_PHRASE}</strong> pour autoriser la suppression.
            </span>
            <input
              ref={inputRef}
              value={phrase}
              onChange={(event) => setPhrase(event.target.value.toUpperCase())}
              onPaste={(event) => event.preventDefault()}
              autoComplete="off"
              spellCheck={false}
              disabled={isSubmitting}
              aria-label="Phrase de confirmation"
              className="mt-3 w-full rounded-xl border border-black/12 bg-black/[0.025] px-4 py-3 font-mono text-sm font-bold tracking-[0.18em] outline-none transition placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:border-rose-400/60 focus:ring-4 focus:ring-rose-400/10 disabled:opacity-50 dark:border-white/12 dark:bg-white/[0.045]"
              placeholder={CONFIRMATION_PHRASE}
            />
          </label>

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
              disabled={!isReady || isSubmitting}
              onClick={() => onConfirm(CONFIRMATION_PHRASE)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={16} />
              {isSubmitting ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
