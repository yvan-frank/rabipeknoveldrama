'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';

export function BookGrantPanel({ bookId, bookTitle }: { bookId: number; bookTitle: string }) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const grant = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/books/${bookId}/grants`, { email: email.trim(), ...(note.trim() ? { note: note.trim() } : {}) });
    },
    onSuccess: () => { setEmail(''); setNote(''); },
  });
  return <section className="rounded-2xl border border-black/10 p-5 dark:border-white/15"><div className="flex items-start gap-3"><Gift className="mt-0.5 text-brand-amber" size={20}/><div><h2 className="font-bold">Offrir ce livre</h2><p className="mt-1 text-sm text-black/45 dark:text-white/45">Accordez l’accès complet à « {bookTitle} » à un lecteur.</p></div></div><form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); grant.mutate(); }}><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail du lecteur" className="rounded-xl border border-black/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-amber/60 dark:border-white/15"/><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Note interne (facultative)" className="rounded-xl border border-black/12 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand-amber/60 dark:border-white/15"/>{grant.isError && <p className="text-sm text-rose-600">{extractApiErrorMessage(grant.error, 'Impossible d’attribuer ce livre.')}</p>}{grant.isSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-300">Livre attribué avec succès.</p>}<button type="submit" disabled={!email.trim() || grant.isPending} className="w-fit rounded-full bg-brand-amber px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">{grant.isPending ? 'Attribution…' : 'Attribuer le livre'}</button></form></section>;
}
