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

  if (error) return <p className="review-form__error">{error}</p>;
  if (books === null) return <p className="empty">Chargement…</p>;

  if (books.length === 0) {
    return (
      <div className="author-books-empty">
        <p>Vous n'avez encore publié aucun livre.</p>
        <a href="/espace-auteur/livres/nouveau" className="btn">
          Publier votre premier livre
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="author-books-grid">
        {books.map((book) => (
          <div key={book.id} className="author-book-card">
            <div className="author-book-card__head">
              <span className="dashboard-book__avatar">{book.title.slice(0, 1).toUpperCase()}</span>
              <div className="dashboard-book__info">
                <span className="dashboard-book__title">{book.title}</span>
                <span className="dashboard-book__meta">{book.category.name}</span>
              </div>
            </div>

            <div className="author-book-card__tags">
              <span className="badge">
                {book._count.chapters} chapitre{book._count.chapters > 1 ? 's' : ''}
              </span>
              <span className="badge">{book.isFree ? 'Gratuit' : `${formatPrice(book.price)} FCFA`}</span>
              {book.isPromotion && <span className="badge badge--free">Promo</span>}
            </div>

            <div className="author-book-card__actions">
              <a href={`/espace-auteur/livres/${book.id}`}>Gérer →</a>
              <button type="button" className="author-book-card__delete" onClick={() => setBookToDelete(book)} aria-label="Supprimer">
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
