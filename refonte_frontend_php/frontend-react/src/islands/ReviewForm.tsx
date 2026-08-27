import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, extractApiErrorMessage, getSessionUser, type SessionUser } from '../lib/apiClient';

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
  user: { id: number; name: string };
  replies: Reply[];
}

interface Props {
  bookId: number;
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Équivalent de la section avis de src/app/livres/[slug]/page.tsx : liste
// les avis existants (GET /comments/book/:bookId, public) et, pour un
// utilisateur connecté, permet de poser ou modifier SON avis (POST, upsert
// côté API — un seul avis par utilisateur et par livre).
export default function ReviewForm({ bookId }: Props) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get(`/comments/book/${bookId}`)
      .then((res) => {
        if (cancelled) return;
        const list: Review[] = res.data?.data ?? [];
        setReviews(list);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });

    getSessionUser().then((user) => {
      if (!cancelled) setUser(user);
    });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  // Une fois connu, préremplit l'éditeur avec l'avis existant de
  // l'utilisateur (upsert = modification, pas doublon).
  useEffect(() => {
    if (!user || !reviews) return;
    const mine = reviews.find((r) => r.user.id === user.id);
    if (mine) {
      setMessage(mine.message);
      setRating(mine.rating);
    }
  }, [user, reviews]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (rating < 1) {
      setError('Choisissez une note entre 1 et 5 étoiles');
      return;
    }
    if (message.trim().length < 1) {
      setError('Votre avis ne peut pas être vide');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/comments/book/${bookId}`, { message: message.trim(), rating });
      const saved: Review = res.data?.data;
      setReviews((prev) => {
        const others = (prev ?? []).filter((r) => r.id !== saved.id);
        return [saved, ...others];
      });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        window.location.href = `/connexion?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      setError(extractApiErrorMessage(err, "Impossible d'enregistrer votre avis"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="review-form">
      <h2>Avis des lecteurs {reviews ? `(${reviews.length})` : ''}</h2>

      {reviews === null ? (
        <p className="empty">Chargement des avis…</p>
      ) : reviews.length === 0 ? (
        <p className="empty">Aucun avis pour le moment — soyez le premier à donner votre avis.</p>
      ) : (
        <ul className="review-form__list">
          {reviews.map((review) => (
            <li key={review.id} className="review-form__item">
              <div className="review-form__item-head">
                <span>{review.user.name}</span>
                <span className="review-form__stars" aria-label={`${review.rating} sur 5`}>
                  {stars(review.rating)}
                </span>
              </div>
              <p>{review.message}</p>
              <p className="review-form__item-date">{formatDate(review.createdAt)}</p>
              {review.replies.map((reply) => (
                <div key={reply.id} className="review-form__reply">
                  Réponse de l'auteur : {reply.content}
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form className="review-form__editor" onSubmit={handleSubmit}>
          <h3>{reviews?.some((r) => r.user.id === user.id) ? 'Modifier mon avis' : 'Laisser un avis'}</h3>
          <div className="review-form__rating-picker" role="radiogroup" aria-label="Note">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                className={value <= rating ? 'is-selected' : ''}
                onClick={() => setRating(value)}
              >
                {value <= rating ? '★' : '☆'}
              </button>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Qu'avez-vous pensé de ce livre ?"
            maxLength={2000}
            required
          />
          {error && <p className="review-form__error">{error}</p>}
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi…' : 'Publier mon avis'}
          </button>
        </form>
      ) : (
        <p className="empty">
          <a href={`/connexion?redirect=${encodeURIComponent(window.location.pathname)}`}>Connectez-vous</a> pour laisser un avis.
        </p>
      )}
    </div>
  );
}
