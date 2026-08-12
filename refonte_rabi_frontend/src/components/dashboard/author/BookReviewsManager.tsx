'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

interface Review { id: number; message: string; rating: number; createdAt: string; user: { id: number; name: string | null }; replies: Array<{ id: number; content: string; createdAt: string }> }

export function BookReviewsManager({ bookId }: { bookId: number }) {
  const queryClient = useQueryClient(); const [drafts, setDrafts] = useState<Record<number, string>>({});
  const reviews = useQuery({ queryKey: ['book', bookId, 'reviews'], queryFn: async () => { const { data } = await apiClient.get<ApiResponse<Review[]>>(`/comments/book/${bookId}`); if (!data.success) throw new Error(data.message); return data.data; } });
  const reply = useMutation({ mutationFn: async ({ id, content }: { id: number; content: string }) => { const { data } = await apiClient.post<ApiResponse<unknown>>(`/comments/review/${id}/reply`, { content }); if (!data.success) throw new Error(data.message); }, onSuccess: () => { setDrafts({}); queryClient.invalidateQueries({ queryKey: ['book', bookId, 'reviews'] }); } });
  if (reviews.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />;
  if (reviews.isError || !reviews.data) return <p className="text-sm text-rose-600">{extractApiErrorMessage(reviews.error, 'Impossible de charger les avis.')}</p>;
  return <section className="rounded-2xl border border-black/10 p-5 dark:border-white/15"><div className="flex items-center gap-2"><MessageCircle size={18} className="text-brand-amber"/><div><h2 className="font-bold">Avis des lecteurs</h2><p className="text-sm text-black/45 dark:text-white/45">Répondez officiellement aux commentaires sur ce livre.</p></div></div><div className="mt-5 space-y-3">{reviews.data.length === 0 ? <p className="text-sm text-black/45 dark:text-white/45">Aucun avis pour le moment.</p> : reviews.data.map(review => <article key={review.id} className="rounded-xl border border-black/8 p-4 dark:border-white/10"><div className="flex justify-between gap-3"><strong className="text-sm">{review.user.name ?? 'Lecteur'}</strong><span className="text-xs text-brand-amber">{'★'.repeat(review.rating)}</span></div><p className="mt-2 text-sm text-black/65 dark:text-white/65">{review.message}</p>{review.replies[0] && <div className="mt-3 rounded-lg bg-brand-amber/10 p-3 text-sm"><strong>Votre réponse</strong><p className="mt-1">{review.replies[0].content}</p></div>}<form className="mt-3 flex gap-2" onSubmit={(e)=>{e.preventDefault();const content=drafts[review.id]?.trim();if(content)reply.mutate({id:review.id,content});}}><input value={drafts[review.id] ?? review.replies[0]?.content ?? ''} onChange={(e)=>setDrafts((d)=>({...d,[review.id]:e.target.value}))} className="min-w-0 flex-1 rounded-lg border border-black/12 bg-transparent px-3 py-2 text-sm dark:border-white/15" placeholder="Écrire une réponse…"/><button type="submit" disabled={reply.isPending} className="rounded-lg bg-brand-amber px-3 text-black disabled:opacity-50" aria-label="Envoyer la réponse"><Send size={15}/></button></form></article>)}</div>{reply.isError && <p className="mt-3 text-sm text-rose-600">{extractApiErrorMessage(reply.error, 'Impossible d’enregistrer votre réponse.')}</p>}</section>;
}
