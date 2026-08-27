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
    <div className="mt-8 flex flex-col gap-6">
      <h2>Avis des lecteurs {reviews ? `(${reviews.length})` : ''}</h2>

      {reviews === null ? (
        <p className="opacity-60">Chargement des avis…</p>
      ) : reviews.length === 0 ? (
        <p className="opacity-60">Aucun avis pour le moment — soyez le premier à donner votre avis.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-black/10 px-4 py-3.5 dark:border-white/10">
              <div className="flex items-center justify-between gap-3 text-[0.85rem] font-semibold">
                <span>{review.user.name}</span>
                <span aria-label={`${review.rating} sur 5`} className="tracking-wide text-brand-amber">
                  {stars(review.rating)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed opacity-85">{review.message}</p>
              <p className="mt-2 text-[0.7rem] font-normal opacity-55">{formatDate(review.createdAt)}</p>
              {review.replies.map((reply) => (
                <div key={reply.id} className="mt-2.5 border-l-2 border-brand-amber px-3 py-2.5 text-[0.8rem] opacity-80">
                  Réponse de l'auteur : {reply.content}
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form className="flex max-w-md flex-col gap-2.5" onSubmit={handleSubmit}>
          <h3>{reviews?.some((r) => r.user.id === user.id) ? 'Modifier mon avis' : 'Laisser un avis'}</h3>
          <div className="flex gap-1 text-[1.3rem]" role="radiogroup" aria-label="Note">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                onClick={() => setRating(value)}
                className={`border-none bg-none p-0 leading-none text-brand-amber ${value <= rating ? 'opacity-100' : 'opacity-35'}`}
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
            className="min-h-[4.5rem] resize-y rounded-lg border border-black/10 bg-white px-2.5 py-2.5 text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
          />
          {error && <p className="text-[0.8rem] text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {isSubmitting ? 'Envoi…' : 'Publier mon avis'}
          </button>
        </form>
      ) : (
        <p className="opacity-60">
          <a href={`/connexion?redirect=${encodeURIComponent(window.location.pathname)}`}>Connectez-vous</a> pour laisser un avis.
        </p>
      )}
    </div>
  );
}
