import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';

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

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

const pickerBtnClass =
  'cursor-pointer rounded-full border border-black/10 bg-transparent px-4 py-2 text-[0.85rem] text-inherit dark:border-white/10';
const pickerBtnActiveClass = 'cursor-pointer rounded-full border border-brand-amber bg-brand-amber px-4 py-2 text-[0.85rem] font-semibold text-neutral-900';

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

  if (error) return <p className="text-[0.8rem] text-rose-600">{error}</p>;
  if (reviews === null) return <p className="opacity-60">Chargement…</p>;

  return (
    <section className="rounded-[1.25rem] border border-black/10 px-6 py-5 dark:border-white/10">
      <h2 className="m-0 text-[1.15rem]">Avis des lecteurs</h2>
      <p className="mt-1 mb-4 text-[0.8rem] opacity-60">Répondez officiellement aux commentaires sur ce livre.</p>

      {reviews.length === 0 ? (
        <p className="opacity-60">Aucun avis pour le moment.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-black/10 px-4 py-3.5 dark:border-white/10">
              <div className="flex items-center justify-between gap-3 text-[0.85rem] font-semibold">
                <span>{review.user.name ?? 'Lecteur'}</span>
                <span className="tracking-wide text-brand-amber">{stars(review.rating)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed opacity-85">{review.message}</p>

              {review.replies[0] && (
                <div className="mt-2.5 border-l-2 border-brand-amber px-3 py-2.5 text-[0.8rem] opacity-80">
                  <strong>Votre réponse</strong>
                  <p className="mt-2 text-sm leading-relaxed opacity-85">{review.replies[0].content}</p>
                </div>
              )}

              <form className="mt-3 flex gap-2" onSubmit={(e) => handleReply(e, review)}>
                <input
                  type="text"
                  value={drafts[review.id] ?? review.replies[0]?.content ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                  placeholder="Écrire une réponse…"
                  className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-[0.85rem] text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="submit"
                  disabled={sendingId === review.id}
                  className="inline-block rounded-lg bg-neutral-900 px-4 py-2 text-[0.85rem] text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  {sendingId === review.id ? '…' : 'Envoyer'}
                </button>
              </form>
            </article>
          ))}
        </div>
      )}

      {replyError && <p className="text-[0.8rem] text-rose-600">{replyError}</p>}
    </section>
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
      .then((res) => setBooks(res.data?.data ?? []))
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger vos livres.')));
  }, [user]);

  if (!user) return null;
  if (error) return <p className="text-[0.8rem] text-rose-600">{error}</p>;
  if (books === null) return <p className="opacity-60">Chargement…</p>;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[1.25rem] border border-black/10 px-6 py-5 dark:border-white/10">
        <h2 className="m-0 text-[1.15rem]">Avis des lecteurs</h2>
        <p className="mt-1 mb-4 text-[0.8rem] opacity-60">Choisissez un livre pour consulter les avis et y répondre.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {books.map((book) => (
            <button
              key={book.id}
              type="button"
              className={book.id === bookId ? pickerBtnActiveClass : pickerBtnClass}
              onClick={() => setBookId(book.id)}
            >
              {book.title}
            </button>
          ))}
        </div>
      </section>

      {bookId !== null && <BookReviewsManager bookId={bookId} />}
    </div>
  );
}
