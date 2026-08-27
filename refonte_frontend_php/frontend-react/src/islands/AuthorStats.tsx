import { useEffect, useState } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';

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

// Équivalent de src/components/dashboard/author/AuthorStatistics.tsx.
// `Summary` reflète ce que renvoie réellement StatsService::getBookStatsSummary
// côté PHP (totalViews/uniqueTrackedViews/reads/likes/shares/purchases/revenue),
// un peu plus riche que l'interface Summary de la source Next.js.
export default function AuthorStats() {
  const [books, setBooks] = useState<AuthorBook[] | null>(null);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyView[] | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    apiClient
      .get('/books/mine')
      .then((res) => setBooks(res.data?.data ?? []))
      .catch((err) => setBooksError(extractApiErrorMessage(err, 'Impossible de charger vos livres.')));
  }, []);

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

  if (booksError) return <p className="review-form__error">{booksError}</p>;
  if (books === null) return <p className="empty">Chargement…</p>;

  return (
    <section className="dashboard-panel">
      <h2>Statistiques de lecture</h2>
      <p className="dashboard-panel__description">Choisissez un livre pour analyser son audience.</p>

      <div className="author-reviews__book-picker">
        {books.map((book) => (
          <button key={book.id} type="button" className={bookId === book.id ? 'is-active' : ''} onClick={() => setBookId(book.id)}>
            {book.title}
          </button>
        ))}
      </div>

      {bookId === null ? (
        <p className="empty" style={{ textAlign: 'center', padding: '2rem 0' }}>
          Sélectionnez un livre.
        </p>
      ) : isLoadingStats ? (
        <p className="empty">Chargement…</p>
      ) : statsError ? (
        <p className="review-form__error">{statsError}</p>
      ) : summary ? (
        <>
          <div className="dashboard-metrics" style={{ marginTop: '1.5rem' }}>
            <div className="dashboard-metric">
              <span className="dashboard-metric__label">Vues</span>
              <strong className="dashboard-metric__value">{summary.totalViews}</strong>
            </div>
            <div className="dashboard-metric">
              <span className="dashboard-metric__label">Lectures</span>
              <strong className="dashboard-metric__value">{summary.reads}</strong>
            </div>
            <div className="dashboard-metric">
              <span className="dashboard-metric__label">J'aime</span>
              <strong className="dashboard-metric__value">{summary.likes}</strong>
            </div>
            <div className="dashboard-metric">
              <span className="dashboard-metric__label">Partages</span>
              <strong className="dashboard-metric__value">{summary.shares}</strong>
            </div>
          </div>

          <div className="author-stats__daily">
            <h3>Vues par jour</h3>
            {daily && daily.length > 0 ? (
              <div className="author-stats__daily-list">
                {daily.map((point) => (
                  <span key={point.viewDate} className="badge">
                    {formatDay(point.viewDate)} · <strong>{point.views}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty">Aucune vue suivie.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
