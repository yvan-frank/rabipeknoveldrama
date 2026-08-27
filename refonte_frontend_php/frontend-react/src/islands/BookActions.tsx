import { useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { formatPrice } from '../lib/formatPrice';

interface BookPart {
  id: number;
  title: string;
  price: number;
  isFree: boolean;
  isPurchased: boolean;
}

interface Props {
  bookId: number;
  isFree: boolean;
  price: number;
  isPromotion: boolean;
  promotionPrice: number;
  likeCount: number;
  isLikedByUser: boolean;
  parts: BookPart[];
}

// Équivalent des actions de src/app/livres/[slug]/page.tsx (like, prix,
// achat par partie) — la lecture elle-même n'est plus possible sur le web
// (cf. BooksController::chapter côté PHP), seuls le like et le panier
// restent des actions web légitimes ici.
export default function BookActions({ bookId, isFree, price, isPromotion, promotionPrice, likeCount, isLikedByUser, parts }: Props) {
  const [liked, setLiked] = useState(isLikedByUser);
  const [count, setCount] = useState(likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [cartState, setCartState] = useState<Record<number, 'idle' | 'adding' | 'added'>>({});

  async function toggleLike() {
    if (isLiking) return;
    setIsLiking(true);
    // Optimiste : le renvoi serveur (liked/likeCount) réajuste juste après.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    try {
      const res = await apiClient.post(`/likes/books/${bookId}`);
      setLiked(res.data?.data?.liked ?? nextLiked);
      setCount(res.data?.data?.likeCount ?? count);
    } catch (err: any) {
      // 401 : pas connecté — on annule l'optimisme et on renvoie vers la connexion.
      setLiked(!nextLiked);
      setCount((c) => c - (nextLiked ? 1 : -1));
      if (err?.response?.status === 401) {
        window.location.href = `/connexion?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    } finally {
      setIsLiking(false);
    }
  }

  async function addPartToCart(partId: number) {
    setCartState((s) => ({ ...s, [partId]: 'adding' }));
    try {
      await apiClient.post('/cart', { partId });
      setCartState((s) => ({ ...s, [partId]: 'added' }));
    } catch (err: any) {
      setCartState((s) => ({ ...s, [partId]: 'idle' }));
      if (err?.response?.status === 401) {
        window.location.href = `/connexion?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
  }

  return (
    <div className="book-actions">
      <div className="book-actions__price">
        {isFree ? (
          <span className="badge badge--free">Gratuit</span>
        ) : isPromotion ? (
          <>
            <span className="book-actions__price-old">{formatPrice(price)} FCFA</span>
            <span className="book-actions__price-current">{formatPrice(promotionPrice)} FCFA</span>
          </>
        ) : (
          <span className="book-actions__price-current">{formatPrice(price)} FCFA</span>
        )}
      </div>

      <button
        type="button"
        onClick={toggleLike}
        disabled={isLiking}
        aria-pressed={liked}
        className={`book-actions__like${liked ? ' is-active' : ''}`}
      >
        {liked ? '♥' : '♡'} {count}
      </button>

      {parts.length > 0 && (
        <ul className="book-actions__parts">
          {parts.map((part) => (
            <li key={part.id}>
              <span>{part.title}</span>
              {part.isFree ? (
                <span className="badge badge--free">Gratuit</span>
              ) : part.isPurchased ? (
                <span className="badge">Déjà acheté</span>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={cartState[part.id] === 'adding' || cartState[part.id] === 'added'}
                  onClick={() => addPartToCart(part.id)}
                >
                  {cartState[part.id] === 'added'
                    ? 'Ajouté au panier'
                    : cartState[part.id] === 'adding'
                      ? 'Ajout…'
                      : `Ajouter au panier — ${formatPrice(part.price)} FCFA`}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
