import { useEffect, useState } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';

interface AuthorBook {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  viewStats: { viewCount: number } | null;
  _count: { chapters: number; likes: number; comments: number };
}

// Équivalent de src/app/espace-auteur/page.tsx : vue d'ensemble des livres
// de l'auteur connecté (GET /books/mine, déjà filtré côté API sur son
// authorId) — la garde de page (redirection si non connecté) est faite en
// amont côté PHP par AuthMiddleware, ce composant suppose une session valide.
export default function AuthorOverview() {
  const [books, setBooks] = useState<AuthorBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/books/mine')
      .then((res) => {
        if (!cancelled) setBooks(res.data?.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiErrorMessage(err, 'Impossible de charger vos livres'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="author-overview__error">{error}</p>;
  if (books === null) return <p className="empty">Chargement…</p>;

  const totals = books.reduce(
    (acc, book) => ({
      views: acc.views + (book.viewStats?.viewCount ?? 0),
      likes: acc.likes + book._count.likes,
      comments: acc.comments + book._count.comments,
      chapters: acc.chapters + book._count.chapters,
    }),
    { views: 0, likes: 0, comments: 0, chapters: 0 },
  );

  return (
    <div className="author-overview">
      <div className="author-overview__stats">
        <div className="author-overview__stat">
          <strong>{books.length}</strong>
          <span>Livre{books.length > 1 ? 's' : ''}</span>
        </div>
        <div className="author-overview__stat">
          <strong>{totals.chapters}</strong>
          <span>Chapitres</span>
        </div>
        <div className="author-overview__stat">
          <strong>{totals.views}</strong>
          <span>Vues</span>
        </div>
        <div className="author-overview__stat">
          <strong>{totals.likes}</strong>
          <span>Likes</span>
        </div>
        <div className="author-overview__stat">
          <strong>{totals.comments}</strong>
          <span>Avis</span>
        </div>
      </div>

      {books.length === 0 ? (
        <p className="empty">Vous n'avez encore publié aucun livre.</p>
      ) : (
        <ul className="author-overview__books">
          {books.map((book) => (
            <li key={book.id}>
              {book.cover && <img src={book.cover} alt="" />}
              <div className="author-overview__book-info">
                <a href={`/espace-auteur/livres/${book.id}`}>{book.title}</a>
                <span>
                  {book._count.chapters} chapitre{book._count.chapters > 1 ? 's' : ''} · {book.viewStats?.viewCount ?? 0} vues ·{' '}
                  {book._count.likes} likes
                </span>
              </div>
              <a href={`/livres/${book.slug}`} className="author-overview__book-view">
                Voir la fiche
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
