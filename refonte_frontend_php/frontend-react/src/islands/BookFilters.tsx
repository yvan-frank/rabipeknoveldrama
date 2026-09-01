import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../lib/apiClient';
import { Checkbox } from '../components/Checkbox';

interface Category {
  id: number;
  name: string;
}

interface Props {
  action: string;
  query: Record<string, string>;
}

const inputClass =
  'rounded border border-black/10 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100';

// Équivalent des filtres de src/app/livres/page.tsx. La liste elle-même
// reste rendue côté PHP (SSR, cf. BooksController::index) : ce composant ne
// fait que soumettre une navigation GET avec les paramètres choisis — pas de
// fetch client de la liste, pour garder le catalogue indexable sans JS.
export default function BookFilters({ action, query }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(query.search ?? '');
  const [categoryId, setCategoryId] = useState(query.categoryId ?? '');
  const [isFree, setIsFree] = useState(query.isFree === 'true');

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/categories')
      .then((res) => {
        if (!cancelled) setCategories(res.data?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (categoryId) params.set('categoryId', categoryId);
    if (isFree) params.set('isFree', 'true');
    // Nouvelle recherche : on repart de la page 1 plutôt que de garder celle
    // en cours, qui n'a probablement plus de sens avec ces filtres.
    window.location.href = params.toString() ? `${action}?${params.toString()}` : action;
  }

  function handleReset() {
    window.location.href = action;
  }

  return (
    <form
      className="my-6 flex flex-wrap items-end gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
      onSubmit={handleSubmit}
    >
      <label className="flex flex-col gap-1 text-xs opacity-75">
        Recherche
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Titre, auteur…" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-xs opacity-75">
        Catégorie
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
          <option value="">Toutes</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <Checkbox checked={isFree} onChange={setIsFree} className="text-xs opacity-75">
        Gratuits uniquement
      </Checkbox>

      <div className="ml-auto flex gap-2">
        <button type="button" onClick={handleReset} className="inline-block rounded-lg px-4 py-2 text-[0.8rem]">
          Réinitialiser
        </button>
        <button
          type="submit"
          className="inline-block rounded-lg bg-neutral-900 px-4 py-2 text-[0.8rem] text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Filtrer
        </button>
      </div>
    </form>
  );
}
