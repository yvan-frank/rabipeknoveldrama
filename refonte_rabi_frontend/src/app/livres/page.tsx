import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import { ApiUnavailableError, serverFetch } from '@/lib/api';
import { BookCard } from '@/components/BookCard';
import { ApiUnavailableNotice } from '@/components/ApiUnavailableNotice';
import { CategoryFilterBar } from '@/components/catalogue/CategoryFilterBar';
import { SearchBar } from '@/components/catalogue/SearchBar';
import type { BookSummary, Category, Paginated } from '@/types/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rabipeknovel.com';
const CATALOGUE_OG_IMAGE = `${SITE_URL}/images/rabipek-about-hero.png`;

export const metadata: Metadata = {
  title: 'Catalogue de livres africains',
  description: 'Explorez le catalogue RabipekNovel et découvrez des livres d’auteurs africains.',
  alternates: { canonical: `${SITE_URL}/livres` },
  openGraph: { type: 'website', url: `${SITE_URL}/livres`, title: 'Catalogue de livres africains', description: 'Découvrez des récits et auteurs africains sur RabipekNovel.', images: [{ url: CATALOGUE_OG_IMAGE, width: 1200, height: 984, alt: 'Catalogue RabipekNovel' }] },
};

interface LivresPageProps {
  searchParams: Promise<{ page?: string; recherche?: string; categorie?: string }>;
}

async function getCategories(): Promise<Category[]> {
  try {
    return await serverFetch<Category[]>('/categories');
  } catch {
    return [];
  }
}

export default async function LivresPage({ searchParams }: LivresPageProps) {
  const { page = '1', recherche, categorie } = await searchParams;
  const categoryId = categorie ? Number(categorie) : undefined;

  const query = new URLSearchParams({ page, pageSize: '24' });
  if (recherche) query.set('search', recherche);
  if (categoryId) query.set('categoryId', String(categoryId));

  let catalog: Paginated<BookSummary> | null = null;
  let isUnavailable = false;

  const [categoriesResult, catalogResult] = await Promise.allSettled([
    getCategories(),
    serverFetch<Paginated<BookSummary>>(`/books?${query.toString()}`),
  ]);

  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];

  if (catalogResult.status === 'fulfilled') {
    catalog = catalogResult.value;
  } else if (catalogResult.reason instanceof ApiUnavailableError) {
    isUnavailable = true;
  } else {
    throw catalogResult.reason;
  }

  const currentPage = Number(page);
  const totalPages = catalog ? Math.max(1, Math.ceil(catalog.total / catalog.pageSize)) : 1;

  function pageHref(p: number) {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (recherche) params.set('recherche', recherche);
    if (categorie) params.set('categorie', categorie);
    return `/livres?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Catalogue de livres africains</h1>

      <div className="flex flex-col gap-4">
        <SearchBar defaultValue={recherche} />
        {categories.length > 0 && <CategoryFilterBar categories={categories} activeCategoryId={categoryId} />}
      </div>

      <div className="mt-8">
        {isUnavailable ? (
          <ApiUnavailableNotice message="Le catalogue est momentanément indisponible. Réessayez dans un instant." />
        ) : catalog && catalog.items.length === 0 ? (
          <p className="py-16 text-center text-black/60 dark:text-white/60">
            Aucun livre ne correspond à votre recherche.
          </p>
        ) : catalog ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {catalog.items.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : null}
      </div>

      {!isUnavailable && totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-4 text-sm">
          <a
            href={currentPage > 1 ? pageHref(currentPage - 1) : undefined}
            aria-disabled={currentPage <= 1}
            className={`flex size-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 ${
              currentPage <= 1 ? 'pointer-events-none opacity-30' : 'hover:border-brand-amber/50'
            }`}
          >
            <ChevronLeft size={16} />
          </a>

          <span className="font-medium">
            Page {currentPage} / {totalPages}
          </span>

          <a
            href={currentPage < totalPages ? pageHref(currentPage + 1) : undefined}
            aria-disabled={currentPage >= totalPages}
            className={`flex size-9 items-center justify-center rounded-full border border-black/10 dark:border-white/10 ${
              currentPage >= totalPages ? 'pointer-events-none opacity-30' : 'hover:border-brand-amber/50'
            }`}
          >
            <ChevronRight size={16} />
          </a>
        </nav>
      )}
    </div>
  );
}
