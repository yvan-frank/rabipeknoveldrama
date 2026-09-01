import { useEffect, useState } from 'react';
import { Trash2, ArrowUpRight, Plus } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { formatPrice } from '../lib/formatPrice';
import { DeleteConfirm, CONFIRMATION_PHRASE } from '../components/DeleteConfirm';
import { useRequireAuth } from '../lib/useRequireAuth';
import { glassPanel, glassPanelHover, badgeNeutral, badgeAmber, errorText, emptyText, skeletonPulse } from '../lib/authorUi';

interface AuthorBook {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  price: number;
  isFree: boolean;
  isPromotion: boolean;
  promotionPrice: number;
  category: { name: string };
  _count: { chapters: number; likes: number; comments: number };
}

// Équivalent de src/components/dashboard/author/AuthorBooksSection.tsx.
export default function AuthorBooksList() {
  const user = useRequireAuth('/espace-auteur/livres');
  const [books, setBooks] = useState<AuthorBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<AuthorBook | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function loadBooks() {
    apiClient
      .get('/books/mine')
      .then((res) => setBooks(res.data?.data ?? []))
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger vos livres.')));
  }

  useEffect(() => {
    if (user) loadBooks();
  }, [user]);

  if (!user) return null;

  async function handleConfirmDelete() {
    if (!bookToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/books/${bookToDelete.id}`, { data: { confirmationPhrase: CONFIRMATION_PHRASE } });
      setBooks((prev) => (prev ?? []).filter((b) => b.id !== bookToDelete.id));
      setBookToDelete(null);
    } catch (err) {
      setDeleteError(extractApiErrorMessage(err, 'La suppression a échoué.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Mes livres</h1>
          <p className="mt-1.5 text-sm text-white/50">{books?.length ?? 0} livre{(books?.length ?? 0) > 1 ? 's' : ''} publié{(books?.length ?? 0) > 1 ? 's' : ''}.</p>
        </div>
        <a
          href="/espace-auteur/livres/nouveau"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-5 py-2.5 text-sm font-semibold text-neutral-950 no-underline shadow-[0_10px_30px_-10px_rgba(245,158,11,0.65)] transition hover:scale-[1.03]"
        >
          <Plus size={16} strokeWidth={2.5} /> Nouveau livre
        </a>
      </div>

      {error ? (
        <p className={errorText}>{error}</p>
      ) : books === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${skeletonPulse} h-40`} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className={`${glassPanel} p-10 text-center`}>
          <p className={emptyText}>Vous n'avez encore publié aucun livre.</p>
          <a
            href="/espace-auteur/livres/nouveau"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-5 py-2.5 text-sm font-semibold text-neutral-950 no-underline"
          >
            Publier votre premier livre <ArrowUpRight size={16} />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <div key={book.id} className={`${glassPanel} ${glassPanelHover} group flex flex-col gap-4 p-4`}>
              <div className="flex items-start gap-3.5">
                {book.cover ? (
                  <img src={book.cover} alt="" className="h-[76px] w-[52px] shrink-0 rounded-lg object-cover shadow-lg" />
                ) : (
                  <span className="flex h-[76px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-amber to-brand-pink text-xl font-bold text-neutral-950">
                    {book.title.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-semibold text-white">{book.title}</p>
                  <p className="mt-0.5 text-[0.72rem] text-white/40">{book.category.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={badgeNeutral}>
                      {book._count.chapters} chap.
                    </span>
                    <span className={badgeNeutral}>{book.isFree ? 'Gratuit' : `${formatPrice(book.price)} FCFA`}</span>
                    {book.isPromotion && <span className={badgeAmber}>Promo</span>}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
                <a href={`/espace-auteur/livres/${book.id}`} className="inline-flex items-center gap-1 text-[0.8rem] font-semibold text-brand-amber no-underline hover:underline">
                  Gérer <ArrowUpRight size={13} />
                </a>
                <button
                  type="button"
                  onClick={() => setBookToDelete(book)}
                  aria-label="Supprimer"
                  className="rounded-lg border-none bg-transparent p-1.5 text-white/30 transition hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bookToDelete && (
        <DeleteConfirm
          title="Supprimer ce livre ?"
          description={`Vous êtes sur le point de retirer « ${bookToDelete.title} »${
            bookToDelete._count.chapters > 0 ? ` et ses ${bookToDelete._count.chapters} chapitre${bookToDelete._count.chapters > 1 ? 's' : ''}` : ''
          }. Cette action est irréversible.`}
          isSubmitting={isDeleting}
          error={deleteError}
          onClose={() => {
            setBookToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
