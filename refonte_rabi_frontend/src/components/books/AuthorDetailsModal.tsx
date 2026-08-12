'use client';

import Image from 'next/image';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Sparkles, X } from 'lucide-react';
import type { AuthorPublic } from '@/types/api';

interface AuthorDetailsModalProps {
  author: AuthorPublic;
  bookTitle: string;
}

function subscribeNoop() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

export function AuthorDetailsModal({ author, bookTitle }: AuthorDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Le déclencheur est rendu inline dans un <p> (page détail livre) : le
  // contenu de la modale (div/section, du contenu de bloc) ne peut donc pas
  // être rendu à cet endroit sans invalider le HTML (un <p> ne peut pas
  // contenir de bloc — le navigateur le fermerait prématurément et
  // désynchroniserait le DOM de ce que React croit avoir rendu). On la sort
  // du flux via un portail vers document.body, disponible seulement après
  // hydratation (document.body n'existe pas côté serveur).
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const authorName = author.name ?? 'Auteur Rabipek';

  const modal = isOpen && (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fermer la fiche auteur"
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="author-modal-title"
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-background text-foreground shadow-2xl shadow-black/20 dark:border-white/15 dark:shadow-black/60"
      >
        <div className="relative h-36 shrink-0 overflow-hidden bg-gradient-to-br from-brand-amber via-rose-400 to-violet-600 sm:h-44">
          {author.cover && (
            <Image src={author.cover} alt="" width={672} height={280} sizes="672px" className="h-full w-full object-cover opacity-45 mix-blend-overlay" unoptimized />
          )}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,.35),transparent_30%)]" />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur transition hover:bg-black/40"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative flex-1 overflow-y-auto px-6 pb-7 sm:px-9 sm:pb-9">
          <div className="absolute -top-12 left-6 flex size-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-background bg-gradient-to-br from-amber-200 to-rose-500 text-3xl font-black text-slate-950 shadow-xl sm:left-9">
            {author.image ? (
              <Image src={author.image} alt="" width={96} height={96} sizes="96px" className="h-full w-full object-cover" unoptimized />
            ) : (
              authorName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="pt-16">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-amber-600 uppercase dark:text-amber-200">
              <Sparkles size={14} /> Auteur Rabipek
            </p>
            <h2 id="author-modal-title" className="mt-2 text-3xl font-bold tracking-tight">
              {authorName}
            </h2>
            {author.designation && (
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">{author.designation}</p>
            )}
            <p className="mt-6 text-sm leading-7 text-black/75 dark:text-white/75">
              {author.about ?? `${authorName} partage ses histoires et son univers sur Rabipek.`}
            </p>
            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-slate-950">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-black/45 dark:text-white/45">Vous consultez</p>
                <p className="truncate text-sm font-medium">{bookTitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="font-semibold text-foreground decoration-brand-amber decoration-2 underline-offset-4 transition hover:text-brand-amber hover:underline"
      >
        {authorName}
      </button>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
