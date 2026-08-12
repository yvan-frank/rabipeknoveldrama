'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { ChapterForm } from './ChapterForm';
import type { ChapterFormValues } from '@/lib/schemas/book';

interface ChapterPanelProps {
  open: boolean;
  title: string;
  defaultValues?: Partial<ChapterFormValues>;
  onSubmit: (values: ChapterFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
  error?: unknown;
  onClose: () => void;
  isLoading?: boolean;
  loadError?: unknown;
  draftKey?: string;
}

// Panel plein écran (comme l'ancien authorabipek) plutôt qu'un formulaire
// inséré au fil de la page — un chapitre mérite tout l'espace disponible
// pour rédiger sereinement, sur mobile comme sur desktop.
export function ChapterPanel({
  open,
  title,
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  error,
  onClose,
  isLoading,
  loadError,
  draftKey,
}: ChapterPanelProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed inset-0 z-50 flex flex-col bg-background shadow-2xl transition-all duration-300 sm:inset-y-4 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-4xl sm:-translate-x-1/2 sm:rounded-3xl sm:border sm:border-black/10 dark:sm:border-white/10 ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/8 px-5 py-4 pt-[calc(env(safe-area-inset-top)_+_1rem)] sm:pt-4 dark:border-white/8">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-9 items-center justify-center rounded-full text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)]">
          {isLoading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
          ) : loadError ? (
            <p className="text-sm text-red-600">Impossible de charger ce chapitre.</p>
          ) : (
            open && (
              <ChapterForm
                defaultValues={defaultValues}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                submitLabel={submitLabel}
                error={error}
                onCancel={onClose}
                draftKey={draftKey}
              />
            )
          )}
        </div>
      </div>
    </>
  );
}
