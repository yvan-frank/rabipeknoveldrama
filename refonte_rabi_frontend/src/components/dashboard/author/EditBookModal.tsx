'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { BookForm } from './BookForm';
import type { BookFormValues } from '@/lib/schemas/book';
import type { Category } from '@/types/api';

interface EditBookModalProps {
  open: boolean;
  categories: Category[];
  defaultValues: Partial<BookFormValues>;
  onSubmit: (values: BookFormValues) => void;
  isSubmitting: boolean;
  error?: unknown;
  onClose: () => void;
}

export function EditBookModal({ open, categories, defaultValues, onSubmit, isSubmitting, error, onClose }: EditBookModalProps) {
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
        aria-label="Modifier le livre"
        className={`fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[85vh] w-full max-w-2xl -translate-y-1/2 overflow-hidden rounded-3xl border border-black/10 bg-background shadow-2xl transition-all duration-300 dark:border-white/10 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/8 px-5 py-4 dark:border-white/8">
          <h2 className="text-lg font-semibold">Modifier le livre</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-9 items-center justify-center rounded-full text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(85vh-4.5rem)] overflow-y-auto px-5 py-5">
          {open && (
            <BookForm
              categories={categories}
              defaultValues={defaultValues}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Enregistrer les modifications"
              error={error}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </>
  );
}
