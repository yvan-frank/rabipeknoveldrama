import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';

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

  if (error) return <p className="review-form__error">{error}</p>;
  if (reviews === null) return <p className="empty">Chargement…</p>;

  return (
    <section className="dashboard-panel">
      <h2>Avis des lecteurs</h2>
      <p className="dashboard-panel__description">Répondez officiellement aux commentaires sur ce livre.</p>

      {reviews.length === 0 ? (
        <p className="empty">Aucun avis pour le moment.</p>
      ) : (
        <div className="author-reviews__list">
          {reviews.map((review) => (
            <article key={review.id} className="review-form__item">
              <div className="review-form__item-head">
                <span>{review.user.name ?? 'Lecteur'}</span>
                <span className="review-form__stars">{stars(review.rating)}</span>
              </div>
              <p>{review.message}</p>

              {review.replies[0] && (
                <div className="review-form__reply">
                  <strong>Votre réponse</strong>
                  <p>{review.replies[0].content}</p>
                </div>
              )}

              <form className="author-reviews__reply-form" onSubmit={(e) => handleReply(e, review)}>
                <input
                  type="text"
                  value={drafts[review.id] ?? review.replies[0]?.content ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                  placeholder="Écrire une réponse…"
                />
                <button type="submit" className="btn btn--primary" disabled={sendingId === review.id}>
                  {sendingId === review.id ? '…' : 'Envoyer'}
                </button>
              </form>
            </article>
          ))}
        </div>
      )}

      {replyError && <p className="review-form__error">{replyError}</p>}
    </section>
  );
}

// Équivalent de src/components/dashboard/author/AuthorReviews.tsx.
export default function AuthorReviews() {
  const [books, setBooks] = useState<AuthorBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<number | null>(null);

  useEffect(() => {
    apiClient
      .get('/books/mine')
      .then((res) => setBooks(res.data?.data ?? []))
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger vos livres.')));
  }, []);

  if (error) return <p className="review-form__error">{error}</p>;
  if (books === null) return <p className="empty">Chargement…</p>;

  return (
    <div className="author-reviews">
      <section className="dashboard-panel">
        <h2>Avis des lecteurs</h2>
        <p className="dashboard-panel__description">Choisissez un livre pour consulter les avis et y répondre.</p>
        <div className="author-reviews__book-picker">
          {books.map((book) => (
            <button
              key={book.id}
              type="button"
              className={book.id === bookId ? 'is-active' : ''}
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
