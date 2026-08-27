import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../lib/apiClient';

interface Category {
  id: number;
  name: string;
}

interface Props {
  action: string;
  query: Record<string, string>;
}

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
    <form className="book-filters" onSubmit={handleSubmit}>
      <label className="book-filters__field">
        Recherche
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Titre, auteur…"
        />
      </label>

      <label className="book-filters__field">
        Catégorie
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Toutes</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="book-filters__field book-filters__checkbox">
        <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
        Gratuits uniquement
      </label>

      <div className="book-filters__actions">
        <button type="button" className="btn" onClick={handleReset}>
          Réinitialiser
        </button>
        <button type="submit" className="btn btn--primary">
          Filtrer
        </button>
      </div>
    </form>
  );
}
