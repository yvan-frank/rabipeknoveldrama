import { useEffect, useState } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';

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
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

const pickerBtnClass =
  'cursor-pointer rounded-full border border-black/10 bg-transparent px-4 py-2 text-[0.85rem] text-inherit dark:border-white/10';
const pickerBtnActiveClass = 'cursor-pointer rounded-full border border-brand-amber bg-brand-amber px-4 py-2 text-[0.85rem] font-semibold text-neutral-900';

// Équivalent de src/components/dashboard/author/AuthorStatistics.tsx.
// `Summary` reflète ce que renvoie réellement StatsService::getBookStatsSummary
// côté PHP (totalViews/uniqueTrackedViews/reads/likes/shares/purchases/revenue),
// un peu plus riche que l'interface Summary de la source Next.js.
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
      .then((res) => setBooks(res.data?.data ?? []))
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
  if (booksError) return <p className="text-[0.8rem] text-rose-600">{booksError}</p>;
  if (books === null) return <p className="opacity-60">Chargement…</p>;

  return (
    <section className="rounded-[1.25rem] border border-black/10 px-6 py-5 dark:border-white/10">
      <h2 className="m-0 text-[1.15rem]">Statistiques de lecture</h2>
      <p className="mt-1 mb-4 text-[0.8rem] opacity-60">Choisissez un livre pour analyser son audience.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {books.map((book) => (
          <button
            key={book.id}
            type="button"
            className={bookId === book.id ? pickerBtnActiveClass : pickerBtnClass}
            onClick={() => setBookId(book.id)}
          >
            {book.title}
          </button>
        ))}
      </div>

      {bookId === null ? (
        <p className="py-8 text-center opacity-60">Sélectionnez un livre.</p>
      ) : isLoadingStats ? (
        <p className="opacity-60">Chargement…</p>
      ) : statsError ? (
        <p className="text-[0.8rem] text-rose-600">{statsError}</p>
      ) : summary ? (
        <>
          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            <div className="flex flex-col gap-2 rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <span className="text-xs opacity-60">Vues</span>
              <strong className="text-[1.6rem]">{summary.totalViews}</strong>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <span className="text-xs opacity-60">Lectures</span>
              <strong className="text-[1.6rem]">{summary.reads}</strong>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <span className="text-xs opacity-60">J'aime</span>
              <strong className="text-[1.6rem]">{summary.likes}</strong>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <span className="text-xs opacity-60">Partages</span>
              <strong className="text-[1.6rem]">{summary.shares}</strong>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <h3 className="mt-0 mb-3 text-base">Vues par jour</h3>
            {daily && daily.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {daily.map((point) => (
                  <span
                    key={point.viewDate}
                    className="inline-block rounded-full bg-black/10 px-2.5 py-1.5 text-xs font-semibold dark:bg-white/10"
                  >
                    {formatDay(point.viewDate)} · <strong>{point.views}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p className="opacity-60">Aucune vue suivie.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
