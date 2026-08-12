'use client';

import { BookOpen, Calendar, Layers, Link as LinkIcon, Pencil, Tag, Trash2, Wallet } from 'lucide-react';
import type { BookManageDetail } from '@/types/api';

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  en: 'Anglais',
  es: 'Espagnol',
  pt: 'Portugais',
  de: 'Allemand',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface BookDetailsViewProps {
  book: BookManageDetail;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function BookDetailsView({ book, onEdit, onDelete, isDeleting }: BookDetailsViewProps) {
  const topics = book.extension?.topics
    ? book.extension.topics.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">Informations du livre</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-400/10 disabled:opacity-50 dark:text-rose-300"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-2 text-sm font-semibold text-black"
          >
            <Pencil size={15} />
            Modifier
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="shrink-0">
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover} alt={book.title} width={144} height={208} className="h-52 w-36 rounded-xl object-cover shadow-md" />
          ) : (
            <div className="flex h-52 w-36 items-center justify-center rounded-xl bg-black/5 text-xs text-black/40 dark:bg-white/10 dark:text-white/40">
              Sans image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold">{book.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">{book.category.name}</span>
            {book.extension?.language && (
              <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">
                {LANGUAGE_LABELS[book.extension.language] ?? book.extension.language}
              </span>
            )}
            <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">{book.isFree ? 'Gratuit' : `${book.price} FCFA`}</span>
            {book.isPromotion && (
              <span className="rounded-full bg-amber-300/20 px-2.5 py-1 font-medium text-amber-600 dark:text-amber-300">
                Promo — {book.promotionPrice} FCFA
              </span>
            )}
            {book.isAdultOnly && (
              <span className="rounded-full bg-rose-400/20 px-2.5 py-1 font-medium text-rose-600 dark:text-rose-300">+18</span>
            )}
          </div>
          <p className="mt-3 text-sm text-black/70 dark:text-white/70">{book.resume}</p>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <DetailRow icon={Calendar} label="Publication" value={formatDate(book.datePub)} />
            <DetailRow icon={Layers} label="Pages" value={String(book.pageNumber)} />
            <DetailRow icon={BookOpen} label="Chapitres gratuits" value={String(book.freeChapterCount)} />
            <DetailRow icon={Wallet} label="Lecture avant paiement" value={book.readBeforePay ? 'Oui' : 'Non'} />
            {book.bookLink && <DetailRow icon={LinkIcon} label="Fichier" value={book.bookLink} />}
          </dl>
        </div>
      </div>

      {(book.extension?.introduction || book.extension?.conclusion || topics.length > 0) && (
        <div className="mt-5 flex flex-col gap-4 border-t border-black/8 pt-5 dark:border-white/10">
          {book.extension?.introduction && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-black/45 uppercase dark:text-white/45">Introduction</p>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">{book.extension.introduction}</p>
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
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">{book.extension.conclusion}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="shrink-0 text-black/40 dark:text-white/40" />
      <span className="text-black/45 dark:text-white/45">{label} :</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
