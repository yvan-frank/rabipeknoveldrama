import { useEffect, useState } from 'react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { formatPrice } from '../lib/formatPrice';
import { DeleteConfirm, CONFIRMATION_PHRASE } from '../components/DeleteConfirm';

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

const badgeClass = 'inline-block rounded-full bg-black/10 px-2 py-0.5 text-[0.7rem] font-semibold dark:bg-white/10';
const badgeFreeClass = 'inline-block rounded-full bg-brand-amber/20 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-amber';

// Équivalent de src/components/dashboard/author/AuthorBooksSection.tsx.
export default function AuthorBooksList() {
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

  useEffect(loadBooks, []);

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

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (books === null) return <p className="opacity-60">Chargement…</p>;

  if (books.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center dark:border-white/10">
        <p className="mb-4 opacity-60">Vous n'avez encore publié aucun livre.</p>
        <a href="/espace-auteur/livres/nouveau" className="inline-block rounded-lg px-5 py-2.5 text-sm no-underline">
          Publier votre premier livre
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        {books.map((book) => (
          <div key={book.id} className="flex flex-col gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber to-brand-pink font-bold text-neutral-900">
                {book.title.slice(0, 1).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">{book.title}</span>
                <span className="text-[0.7rem] opacity-55">{book.category.name}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className={badgeClass}>
                {book._count.chapters} chapitre{book._count.chapters > 1 ? 's' : ''}
              </span>
              <span className={badgeClass}>{book.isFree ? 'Gratuit' : `${formatPrice(book.price)} FCFA`}</span>
              {book.isPromotion && <span className={badgeFreeClass}>Promo</span>}
            </div>

            <div className="mt-1 flex items-center justify-between">
              <a href={`/espace-auteur/livres/${book.id}`} className="text-[0.85rem] font-semibold text-brand-amber no-underline">
                Gérer →
              </a>
              <button
                type="button"
                onClick={() => setBookToDelete(book)}
                aria-label="Supprimer"
                className="rounded border-none bg-none p-1 text-base opacity-50 hover:bg-rose-600/10 hover:opacity-100"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

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
    </>
  );
}
