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

  if (error) return <p className="text-rose-600">{error}</p>;
  if (books === null) return <p className="opacity-60">Chargement…</p>;

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
    <div>
      <div className="my-6 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-3">
        <div className="rounded-xl border border-black/10 p-3.5 text-center dark:border-white/10">
          <strong className="block text-2xl">{books.length}</strong>
          <span className="text-xs opacity-65">Livre{books.length > 1 ? 's' : ''}</span>
        </div>
        <div className="rounded-xl border border-black/10 p-3.5 text-center dark:border-white/10">
          <strong className="block text-2xl">{totals.chapters}</strong>
          <span className="text-xs opacity-65">Chapitres</span>
        </div>
        <div className="rounded-xl border border-black/10 p-3.5 text-center dark:border-white/10">
          <strong className="block text-2xl">{totals.views}</strong>
          <span className="text-xs opacity-65">Vues</span>
        </div>
        <div className="rounded-xl border border-black/10 p-3.5 text-center dark:border-white/10">
          <strong className="block text-2xl">{totals.likes}</strong>
          <span className="text-xs opacity-65">Likes</span>
        </div>
        <div className="rounded-xl border border-black/10 p-3.5 text-center dark:border-white/10">
          <strong className="block text-2xl">{totals.comments}</strong>
          <span className="text-xs opacity-65">Avis</span>
        </div>
      </div>

      {books.length === 0 ? (
        <p className="opacity-60">Vous n'avez encore publié aucun livre.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {books.map((book) => (
            <li key={book.id} className="flex items-center gap-3.5 rounded-xl border border-black/10 px-3.5 py-2.5 dark:border-white/10">
              {book.cover && <img src={book.cover} alt="" className="h-[66px] w-11 shrink-0 rounded object-cover" />}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <a href={`/espace-auteur/livres/${book.id}`} className="font-semibold no-underline">
                  {book.title}
                </a>
                <span className="text-xs opacity-60">
                  {book._count.chapters} chapitre{book._count.chapters > 1 ? 's' : ''} · {book.viewStats?.viewCount ?? 0} vues ·{' '}
                  {book._count.likes} likes
                </span>
              </div>
              <a href={`/livres/${book.slug}`} className="text-[0.8rem] whitespace-nowrap no-underline">
                Voir la fiche
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
