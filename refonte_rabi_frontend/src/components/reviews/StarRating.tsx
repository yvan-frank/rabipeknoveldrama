'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

// Sans `onChange` : affichage lecture seule (moyenne, avis existant).
// Avec `onChange` : sélecteur interactif (formulaire de nouvel avis).
export function StarRating({ value, onChange, size = 18 }: StarRatingProps) {
  const isInteractive = Boolean(onChange);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!isInteractive}
          onClick={() => onChange?.(star)}
          aria-label={isInteractive ? `Noter ${star} sur 5` : undefined}
          className={isInteractive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={size}
            className={star <= Math.round(value) ? 'fill-brand-amber text-brand-amber' : 'text-black/20 dark:text-white/20'}
          />
        </button>
      ))}
    </div>
  );
}
