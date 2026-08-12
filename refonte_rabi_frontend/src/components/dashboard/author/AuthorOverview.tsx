'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronRight, Eye, Heart, Layers, MessageCircle, Sparkles } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { useSession } from '@/hooks/useAuth';
import type { ApiResponse, AuthorBookListItem } from '@/types/api';

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BookOpen }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-black/[0.02] p-4 dark:border-white/8 dark:bg-white/[0.035]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-black/45 dark:text-white/45">{label}</span>
        <Icon size={17} className="text-amber-500 dark:text-amber-200" />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

export function AuthorOverview() {
  const { data: user } = useSession();

  const booksQuery = useQuery({
    queryKey: ['author', 'books'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AuthorBookListItem[]>>('/books/mine');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  if (booksQuery.isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-black/[0.04] dark:bg-white/[0.06]" />;
  if (booksQuery.isError || !booksQuery.data) {
    return (
      <p className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-600 dark:text-rose-100">
        {extractApiErrorMessage(booksQuery.error, 'Impossible de charger vos statistiques.')}
      </p>
    );
  }

  const books = booksQuery.data;
  const totalChapters = books.reduce((sum, book) => sum + book._count.chapters, 0);
  const totalViews = books.reduce((sum, book) => sum + (book.viewStats?.viewCount ?? 0), 0);
  const totalLikes = books.reduce((sum, book) => sum + book._count.likes, 0);
  const totalReviews = books.reduce((sum, book) => sum + book._count.comments, 0);
  const recentBooks = books.slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br from-amber-300 via-amber-400 to-rose-500 p-6 text-neutral-950 sm:p-9 dark:border-white/10">
        <div className="relative z-10 max-w-xl">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={17} /> Votre espace de création
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Bonjour {user?.email.split('@')[0]}, prêt·e à publier ?</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-900/75">
            Gérez vos livres, suivez leur portée et faites vivre vos histoires.
          </p>
          <Link
            href="/espace-auteur/livres"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            Gérer mes livres <ChevronRight size={16} />
          </Link>
        </div>
        <div className="absolute -right-12 -bottom-20 size-72 rounded-full bg-white/25 blur-3xl" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Livres publiés" value={books.length} icon={BookOpen} />
        <Metric label="Chapitres" value={totalChapters} icon={Layers} />
        <Metric label="Vues totales" value={totalViews} icon={Eye} />
        <Metric label="Mentions j'aime" value={totalLikes} icon={Heart} />
      </section>

      <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Derniers livres</h2>
            <p className="mt-1 text-sm text-black/45 dark:text-white/45">{totalReviews} avis reçus au total.</p>
          </div>
          <Link href="/espace-auteur/livres" className="flex items-center gap-1 text-sm font-medium text-brand-amber hover:underline">
            Tout voir <ChevronRight size={14} />
          </Link>
        </div>

        {recentBooks.length === 0 ? (
          <p className="py-8 text-sm text-black/45 dark:text-white/45">Vous n&apos;avez encore publié aucun livre.</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentBooks.map((book) => (
              <Link
                key={book.id}
                href={`/espace-auteur/livres/${book.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-black/8 bg-black/[0.02] p-3 transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:bg-black/[0.04] dark:border-white/8 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]"
              >
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-rose-500 text-sm font-bold text-neutral-950">
                  {book.title.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{book.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-black/45 dark:text-white/45">
                    <span className="flex items-center gap-1">
                      <Eye size={11} /> {book.viewStats?.viewCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={11} /> {book._count.comments}
                    </span>
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-black/30 transition group-hover:translate-x-0.5 group-hover:text-amber-500 dark:text-white/30 dark:group-hover:text-amber-200" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
