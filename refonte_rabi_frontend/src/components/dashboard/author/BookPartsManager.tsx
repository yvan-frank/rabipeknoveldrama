'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers3, Plus, Trash2 } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { formatPrice } from '@/lib/format-price';
import type { ApiResponse, BookPart } from '@/types/api';

export function BookPartsManager({ bookId, parts }: { bookId: number; parts: BookPart[] }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [freeChapterCount, setFreeChapterCount] = useState(0);

  const refreshBook = () => queryClient.invalidateQueries({ queryKey: ['author', 'book', bookId] });
  const createPart = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<BookPart>>('/book-parts', {
        bookId,
        title,
        partNumber: Math.max(0, ...parts.map((part) => part.partNumber)) + 1,
        price,
        isFree,
        freeChapterCount,
      });
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      setTitle('');
      setPrice(0);
      setIsFree(false);
      setFreeChapterCount(0);
      refreshBook();
    },
  });

  const deletePart = useMutation({
    mutationFn: async (partId: number) => apiClient.delete(`/book-parts/${partId}`),
    onSuccess: refreshBook,
  });

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Layers3 size={18} className="text-brand-amber" /> Parties à vendre</h2>
          <p className="mt-1 text-sm text-black/50 dark:text-white/50">Chaque partie est achetée séparément et peut contenir plusieurs chapitres.</p>
        </div>
        <span className="rounded-full bg-brand-amber/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{parts.length} partie{parts.length > 1 ? 's' : ''}</span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim()) createPart.mutate();
        }}
        className="mt-5 grid gap-3 rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-4 sm:grid-cols-2 dark:border-white/15 dark:bg-white/[0.03]"
      >
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre de la partie" className="rounded-xl border border-black/12 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-amber/60 dark:border-white/15" />
        <input type="number" min="0" value={price} onChange={(event) => setPrice(Number(event.target.value))} disabled={isFree} placeholder="Prix FCFA" className="rounded-xl border border-black/12 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-amber/60 disabled:opacity-50 dark:border-white/15" />
        <label className="flex items-center gap-2 text-sm text-black/65 dark:text-white/65"><input type="checkbox" checked={isFree} onChange={(event) => setIsFree(event.target.checked)} /> Partie gratuite</label>
        <input type="number" min="0" value={freeChapterCount} onChange={(event) => setFreeChapterCount(Number(event.target.value))} placeholder="Chapitres gratuits" className="rounded-xl border border-black/12 bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-amber/60 dark:border-white/15" />
        <button type="submit" disabled={createPart.isPending || !title.trim()} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"><Plus size={16} />{createPart.isPending ? 'Création…' : 'Ajouter une partie'}</button>
        {createPart.isError && <p className="sm:col-span-2 text-xs text-rose-600">{extractApiErrorMessage(createPart.error, 'Impossible de créer la partie.')}</p>}
      </form>

      <div className="mt-4 divide-y divide-black/6 dark:divide-white/8">
        {parts.length === 0 ? <p className="py-5 text-center text-sm text-black/45 dark:text-white/45">Ajoutez une partie pour proposer une vente par section.</p> : parts.map((part) => (
          <div key={part.id} className="flex items-center gap-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-amber/15 text-sm font-bold text-amber-700 dark:text-amber-300">{part.partNumber}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{part.title}</p><p className="mt-0.5 text-xs text-black/45 dark:text-white/45">{part.chapters.length} chapitre{part.chapters.length > 1 ? 's' : ''} · {part.isFree ? 'Gratuite' : `${formatPrice(part.price)} FCFA`}</p></div>
            <button type="button" onClick={() => { if (window.confirm(`Supprimer la partie « ${part.title} » ? Ses chapitres resteront dans le livre.`)) deletePart.mutate(part.id); }} disabled={deletePart.isPending} aria-label={`Supprimer ${part.title}`} className="flex size-9 items-center justify-center rounded-full text-black/40 hover:bg-rose-400/10 hover:text-rose-500 disabled:opacity-50 dark:text-white/40"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      {deletePart.isError && <p className="mt-3 text-xs text-rose-600">{extractApiErrorMessage(deletePart.error, 'Impossible de supprimer cette partie.')}</p>}
    </section>
  );
}
