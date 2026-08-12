'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { useSession } from '@/hooks/useAuth';

export function AddPartToCartButton({ partId }: { partId: number }) {
  const { data: user } = useSession();
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function addToCart() {
    if (!user) {
      window.location.assign('/connexion');
      return;
    }
    setStatus('adding');
    setError(null);
    try {
      await apiClient.post('/cart', { partId });
      setStatus('added');
    } catch (requestError) {
      setError(extractApiErrorMessage(requestError, 'Impossible d’ajouter cette partie au panier.'));
      setStatus('idle');
    }
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button type="button" onClick={addToCart} disabled={status !== 'idle'} className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-85 disabled:opacity-50"><ShoppingBag size={15} />{status === 'adding' ? 'Ajout…' : status === 'added' ? 'Ajoutée au panier' : 'Ajouter au panier'}</button>
      {error && <span className="max-w-48 text-right text-xs text-rose-600 dark:text-rose-300">{error}</span>}
    </span>
  );
}
