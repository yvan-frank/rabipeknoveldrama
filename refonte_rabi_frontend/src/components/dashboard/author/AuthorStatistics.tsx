'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Eye, Heart, Share2 } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import type { ApiResponse, AuthorBookListItem } from '@/types/api';

interface Summary { totalViews: number; reads: number; likes: number; shares: number }
interface DailyView { viewDate: string; views: number }

export function AuthorStatistics() {
  const [bookId, setBookId] = useState<number | null>(null);
  const books = useQuery({ queryKey: ['author', 'books'], queryFn: async () => { const { data } = await apiClient.get<ApiResponse<AuthorBookListItem[]>>('/books/mine'); if (!data.success) throw new Error(data.message); return data.data; } });
  const statistics = useQuery({ enabled: bookId !== null, queryKey: ['author', 'statistics', bookId], queryFn: async () => { const [summary, daily] = await Promise.all([apiClient.get<ApiResponse<Summary>>(`/stats/books/${bookId}/summary`), apiClient.get<ApiResponse<DailyView[]>>(`/stats/books/${bookId}/views`, { params: { groupBy: 'day' } })]); if (!summary.data.success) throw new Error(summary.data.message); if (!daily.data.success) throw new Error(daily.data.message); return { summary: summary.data.data, daily: daily.data.data }; } });
  if (books.isLoading) return <div className="h-64 animate-pulse rounded-[1.75rem] bg-black/[0.04] dark:bg-white/[0.06]" />;
  if (books.isError || !books.data) return <p className="rounded-2xl bg-rose-400/10 p-4 text-sm text-rose-600">{extractApiErrorMessage(books.error, 'Impossible de charger vos livres.')}</p>;
  return <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]"><h2 className="text-xl font-bold">Statistiques de lecture</h2><p className="mt-1 text-sm text-black/45 dark:text-white/45">Choisissez un livre pour analyser son audience.</p><div className="mt-5 flex flex-wrap gap-2">{books.data.map((book) => <button key={book.id} type="button" onClick={() => setBookId(book.id)} className={`rounded-full px-4 py-2 text-sm ${bookId === book.id ? 'bg-brand-amber text-black' : 'border border-black/10 dark:border-white/15'}`}>{book.title}</button>)}</div>{bookId === null ? <p className="py-10 text-center text-sm text-black/45 dark:text-white/45">Sélectionnez un livre.</p> : statistics.isLoading ? <div className="mt-6 h-32 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" /> : statistics.isError || !statistics.data ? <p className="mt-6 text-sm text-rose-600">{extractApiErrorMessage(statistics.error, 'Impossible de charger les statistiques.')}</p> : <><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Vues" value={statistics.data.summary.totalViews} icon={Eye}/><Metric label="Lectures" value={statistics.data.summary.reads} icon={BookOpen}/><Metric label="J’aime" value={statistics.data.summary.likes} icon={Heart}/><Metric label="Partages" value={statistics.data.summary.shares} icon={Share2}/></div><div className="mt-6 rounded-2xl border border-black/8 p-4 dark:border-white/8"><h3 className="font-semibold">Vues par jour</h3><div className="mt-3 flex flex-wrap gap-2">{statistics.data.daily.length ? statistics.data.daily.map((point) => <span key={point.viewDate} className="rounded-lg bg-black/[0.04] px-3 py-2 text-xs dark:bg-white/[0.07]">{new Date(point.viewDate).toLocaleDateString('fr-FR')} · <strong>{point.views}</strong></span>) : <p className="text-sm text-black/45 dark:text-white/45">Aucune vue suivie.</p>}</div></div></>}</section>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Eye }) { return <div className="rounded-2xl border border-black/8 p-4 dark:border-white/8"><div className="flex justify-between text-xs text-black/45 dark:text-white/45"><span>{label}</span><Icon size={16}/></div><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
