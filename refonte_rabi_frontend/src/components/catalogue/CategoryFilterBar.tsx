'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/types/api';

interface CategoryFilterBarProps {
  categories: Category[];
  activeCategoryId?: number;
}

// Barre de filtres horizontale, défilable, style "chips" — pilote l'URL
// (?categorie=ID) plutôt qu'un state local, pour que le filtre survive au
// rechargement et soit partageable via lien.
export function CategoryFilterBar({ categories, activeCategoryId }: CategoryFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectCategory(categoryId?: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set('categorie', String(categoryId));
    } else {
      params.delete('categorie');
    }
    params.delete('page');
    router.push(`/livres?${params.toString()}`);
  }

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => selectCategory(undefined)}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
          !activeCategoryId
            ? 'bg-gradient-to-r from-brand-amber to-brand-pink text-black'
            : 'border border-black/10 text-black/70 hover:border-black/30 dark:border-white/10 dark:text-white/70 dark:hover:border-white/30'
        }`}
      >
        Tous
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => selectCategory(category.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
            activeCategoryId === category.id
              ? 'bg-gradient-to-r from-brand-amber to-brand-pink text-black'
              : 'border border-black/10 text-black/70 hover:border-black/30 dark:border-white/10 dark:text-white/70 dark:hover:border-white/30'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
