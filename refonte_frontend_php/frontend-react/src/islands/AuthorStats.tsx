import { useEffect, useState } from 'react';
import { Eye, BookOpenCheck, Heart, Share2, BarChart3 } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { glassPanel, glassInset, errorText, emptyText, skeletonPulse } from '../lib/authorUi';

interface AuthorBook {
  id: number;
  title: string;
}

interface Summary {
  totalViews: number;
  uniqueTrackedViews: number;
  reads: number;
  likes: number;
  shares: number;
  purchases: number;
  revenue: number;
}

interface DailyView {
  viewDate: string;
  views: number;
}

function formatDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className={`${glassInset} flex flex-col gap-3 p-4`}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber/20 to-brand-pink/20 text-brand-amber">{icon}</span>
      <div>
        <p className="text-2xl font-bold text-white">{value.toLocaleString('fr-FR')}</p>
        <p className="text-[0.72rem] text-white/45">{label}</p>
      </div>
    </div>
  );
}

// Équivalent de src/components/dashboard/author/AuthorStatistics.tsx.
export default function AuthorStats() {
  const user = useRequireAuth('/espace-auteur/statistiques');
  const [books, setBooks] = useState<AuthorBook[] | null>(null);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyView[] | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiClient
      .get('/books/mine')
      .then((res) => {
        const list: AuthorBook[] = res.data?.data ?? [];
        setBooks(list);
        if (list.length > 0) setBookId((prev) => prev ?? list[0].id);
      })
      .catch((err) => setBooksError(extractApiErrorMessage(err, 'Impossible de charger vos livres.')));
  }, [user]);

  useEffect(() => {
    if (bookId === null) return;
    let cancelled = false;
    setIsLoadingStats(true);
    setStatsError(null);
    setSummary(null);
    setDaily(null);

    Promise.all([apiClient.get(`/stats/books/${bookId}/summary`), apiClient.get(`/stats/books/${bookId}/views`, { params: { groupBy: 'day' } })])
      .then(([summaryRes, dailyRes]) => {
        if (cancelled) return;
        setSummary(summaryRes.data?.data ?? null);
        setDaily(dailyRes.data?.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setStatsError(extractApiErrorMessage(err, 'Impossible de charger les statistiques.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (!user) return null;

  const maxDailyViews = Math.max(1, ...(daily ?? []).map((d) => d.views));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Statistiques</h1>
        <p className="mt-1.5 text-sm text-white/50">Analysez l'audience de chacun de vos livres.</p>
      </div>

      {booksError ? (
        <p className={errorText}>{booksError}</p>
      ) : books === null ? (
        <div className={`${skeletonPulse} h-64`} />
      ) : books.length === 0 ? (
        <div className={`${glassPanel} p-10 text-center`}>
          <p className={emptyText}>Publiez un livre pour voir apparaître ses statistiques ici.</p>
        </div>
      ) : (
        <div className={`${glassPanel} p-6`}>
          <div className="flex flex-wrap gap-2">
            {books.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => setBookId(book.id)}
                className={`rounded-full border px-4 py-2 text-[0.82rem] font-medium transition ${
                  bookId === book.id
                    ? 'border-transparent bg-gradient-to-r from-brand-amber to-brand-pink text-neutral-950'
                    : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                {book.title}
              </button>
            ))}
          </div>

          {isLoadingStats ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${skeletonPulse} h-24`} />
              ))}
            </div>
          ) : statsError ? (
            <p className={`mt-6 ${errorText}`}>{statsError}</p>
          ) : summary ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile icon={<Eye size={16} />} label="Vues" value={summary.totalViews} />
                <StatTile icon={<BookOpenCheck size={16} />} label="Lectures" value={summary.reads} />
                <StatTile icon={<Heart size={16} />} label="J'aime" value={summary.likes} />
                <StatTile icon={<Share2 size={16} />} label="Partages" value={summary.shares} />
              </div>

              <div className={`mt-4 ${glassInset} p-5`}>
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <BarChart3 size={16} className="text-brand-amber" /> Vues par jour
                </div>
                {daily && daily.length > 0 ? (
                  <div className="flex h-32 items-end gap-1.5 overflow-x-auto pb-1">
                    {daily.map((point) => (
                      <div key={point.viewDate} className="group flex min-w-[26px] flex-1 flex-col items-center gap-1.5">
                        <div className="relative flex h-24 w-full items-end">
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-brand-amber to-brand-pink opacity-70 transition group-hover:opacity-100"
                            style={{ height: `${Math.max(6, (point.views / maxDailyViews) * 100)}%` }}
                          />
                          <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center">
                            <span className="rounded-md bg-black/80 px-1.5 py-0.5 text-[0.65rem] text-white opacity-0 transition group-hover:opacity-100">
                              {point.views}
                            </span>
                          </div>
                        </div>
                        <span className="text-[0.6rem] whitespace-nowrap text-white/35">{formatDay(point.viewDate)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={emptyText}>Aucune vue suivie pour l'instant.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
