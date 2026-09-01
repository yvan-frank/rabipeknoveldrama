import { useEffect, useState, type FormEvent } from 'react';
import { Star, Send, MessageSquareQuote } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { glassPanel, glassInset, inputBase, errorText, emptyText, skeletonPulse } from '../lib/authorUi';

interface AuthorBook {
  id: number;
  title: string;
}

interface Reply {
  id: number;
  content: string;
  createdAt: string;
}

interface Review {
  id: number;
  message: string;
  rating: number;
  createdAt: string;
  user: { id: number; name: string | null };
  replies: Reply[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < rating ? 'fill-brand-amber text-brand-amber' : 'text-white/15'} />
      ))}
    </span>
  );
}

// Équivalent de BookReviewsManager.tsx : réponse officielle de l'auteur à un
// avis (POST /comments/review/:id/reply, upsert — une seule réponse par
// avis, republier écrase la précédente).
function BookReviewsManager({ bookId }: { bookId: number }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  function loadReviews() {
    setReviews(null);
    apiClient
      .get(`/comments/book/${bookId}`)
      .then((res) => setReviews(res.data?.data ?? []))
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger les avis.')));
  }

  useEffect(loadReviews, [bookId]);

  async function handleReply(event: FormEvent, review: Review) {
    event.preventDefault();
    const content = (drafts[review.id] ?? '').trim();
    if (!content) return;

    setSendingId(review.id);
    setReplyError(null);
    try {
      await apiClient.post(`/comments/review/${review.id}/reply`, { content });
      setDrafts((d) => ({ ...d, [review.id]: '' }));
      loadReviews();
    } catch (err) {
      setReplyError(extractApiErrorMessage(err, "Impossible d'enregistrer votre réponse."));
    } finally {
      setSendingId(null);
    }
  }

  if (error) return <p className={`mt-4 ${errorText}`}>{error}</p>;
  if (reviews === null) {
    return (
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={`${skeletonPulse} h-28`} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-5">
      {reviews.length === 0 ? (
        <div className={`${glassInset} p-8 text-center`}>
          <p className={emptyText}>Aucun avis pour ce livre pour le moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <article key={review.id} className={`${glassInset} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">{review.user.name ?? 'Lecteur'}</span>
                <Stars rating={review.rating} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{review.message}</p>

              {review.replies[0] && (
                <div className="mt-3 flex gap-2 rounded-xl border-l-2 border-brand-amber bg-brand-amber/[0.06] px-3 py-2.5">
                  <MessageSquareQuote size={14} className="mt-0.5 shrink-0 text-brand-amber" />
                  <div>
                    <p className="text-[0.7rem] font-semibold text-brand-amber">Votre réponse</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/70">{review.replies[0].content}</p>
                  </div>
                </div>
              )}

              <form className="mt-3 flex gap-2" onSubmit={(e) => handleReply(e, review)}>
                <input
                  type="text"
                  value={drafts[review.id] ?? review.replies[0]?.content ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                  placeholder="Écrire une réponse…"
                  className={`${inputBase} py-2`}
                />
                <button
                  type="submit"
                  disabled={sendingId === review.id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-amber to-brand-pink px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {sendingId === review.id ? '…' : <Send size={14} />}
                </button>
              </form>
            </article>
          ))}
        </div>
      )}

      {replyError && <p className={`mt-3 ${errorText}`}>{replyError}</p>}
    </div>
  );
}

// Équivalent de src/components/dashboard/author/AuthorReviews.tsx.
export default function AuthorReviews() {
  const user = useRequireAuth('/espace-auteur/avis');
  const [books, setBooks] = useState<AuthorBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    apiClient
      .get('/books/mine')
      .then((res) => {
        const list: AuthorBook[] = res.data?.data ?? [];
        setBooks(list);
        if (list.length > 0) setBookId((prev) => prev ?? list[0].id);
      })
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger vos livres.')));
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Avis reçus</h1>
        <p className="mt-1.5 text-sm text-white/50">Répondez officiellement aux commentaires de vos lecteurs.</p>
      </div>

      {error ? (
        <p className={errorText}>{error}</p>
      ) : books === null ? (
        <div className={`${skeletonPulse} h-40`} />
      ) : books.length === 0 ? (
        <div className={`${glassPanel} p-10 text-center`}>
          <p className={emptyText}>Publiez un livre pour commencer à recevoir des avis.</p>
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

          {bookId !== null && <BookReviewsManager bookId={bookId} />}
        </div>
      )}
    </div>
  );
}
