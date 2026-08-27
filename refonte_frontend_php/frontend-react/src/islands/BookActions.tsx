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

const badgeClass = 'inline-block rounded-full bg-black/10 px-2 py-0.5 text-[0.7rem] font-semibold dark:bg-white/10';
const badgeFreeClass = 'inline-block rounded-full bg-brand-amber/20 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-amber';

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
    <div className="my-4 mb-6 flex max-w-96 flex-col gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-baseline gap-2 font-semibold">
        {isFree ? (
          <span className={badgeFreeClass}>Gratuit</span>
        ) : isPromotion ? (
          <>
            <span className="text-[0.85rem] font-normal opacity-50 line-through">{formatPrice(price)} FCFA</span>
            <span className="text-[1.1rem] text-brand-amber">{formatPrice(promotionPrice)} FCFA</span>
          </>
        ) : (
          <span className="text-[1.1rem] text-brand-amber">{formatPrice(price)} FCFA</span>
        )}
      </div>

      <button
        type="button"
        onClick={toggleLike}
        disabled={isLiking}
        aria-pressed={liked}
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.85rem] ${
          liked ? 'border-brand-pink text-brand-pink' : 'border-black/10 dark:border-white/10'
        }`}
      >
        {liked ? '♥' : '♡'} {count}
      </button>

      {parts.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {parts.map((part) => (
            <li key={part.id} className="flex items-center justify-between gap-3 text-[0.85rem]">
              <span>{part.title}</span>
              {part.isFree ? (
                <span className={badgeFreeClass}>Gratuit</span>
              ) : part.isPurchased ? (
                <span className={badgeClass}>Déjà acheté</span>
              ) : (
                <button
                  type="button"
                  disabled={cartState[part.id] === 'adding' || cartState[part.id] === 'added'}
                  onClick={() => addPartToCart(part.id)}
                  className="inline-block rounded-lg bg-neutral-900 px-3 py-1.5 text-[0.8rem] text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
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
