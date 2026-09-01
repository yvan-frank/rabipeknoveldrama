import { useEffect, useState } from 'react';
import { BookOpen, Eye, Heart, MessageCircle, Sparkles, ArrowUpRight } from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { glassPanel, glassPanelHover, errorText, emptyText, skeletonPulse, gradientText } from '../lib/authorUi';

interface AuthorBook {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  viewStats: { viewCount: number } | null;
  _count: { chapters: number; likes: number; comments: number };
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className={`${glassPanel} ${glassPanelHover} flex items-center gap-4 p-5`}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber/20 to-brand-pink/20 text-brand-amber">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white">{value.toLocaleString('fr-FR')}</p>
        <p className="truncate text-[0.75rem] text-white/45">{label}</p>
      </div>
    </div>
  );
}

// Équivalent de src/app/espace-auteur/page.tsx : vue d'ensemble des livres
// de l'auteur connecté (GET /books/mine, déjà filtré côté API sur son
// authorId). La garde de page est faite côté client via useRequireAuth.
export default function AuthorOverview() {
  const user = useRequireAuth('/espace-auteur');
  const [books, setBooks] = useState<AuthorBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiClient
      .get('/books/mine')
      .then((res) => {
        if (!cancelled) setBooks(res.data?.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiErrorMessage(err, 'Impossible de charger vos livres'));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const totals = (books ?? []).reduce(
    (acc, book) => ({
      views: acc.views + (book.viewStats?.viewCount ?? 0),
      likes: acc.likes + book._count.likes,
      comments: acc.comments + book._count.comments,
      chapters: acc.chapters + book._count.chapters,
    }),
    { views: 0, likes: 0, comments: 0, chapters: 0 },
  );

  return (
    <div className="flex flex-col gap-8">
      <section
        className={`${glassPanel} relative overflow-hidden p-7 sm:p-9`}
        style={{ backgroundImage: 'radial-gradient(circle at 85% 0%, rgba(245,158,11,0.12), transparent 55%)' }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-amber/25 bg-brand-amber/10 px-3 py-1 text-[0.7rem] font-semibold text-brand-amber">
          <Sparkles size={12} /> Studio auteur
        </span>
        <h1 className="mt-4 max-w-xl text-[clamp(1.6rem,3.2vw,2.4rem)] font-bold tracking-tight text-white">
          Bienvenue dans votre <span className={gradientText}>studio créatif</span>.
        </h1>
        <p className="mt-2 max-w-lg text-sm text-white/55">
          Publiez, suivez votre audience et faites grandir votre lectorat — tout ce qu'il faut pour donner vie à vos histoires.
        </p>
        <a
          href="/espace-auteur/livres/nouveau"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-5 py-2.5 text-sm font-semibold text-neutral-950 no-underline shadow-[0_10px_30px_-10px_rgba(245,158,11,0.65)] transition hover:scale-[1.03]"
        >
          Publier un nouveau livre <ArrowUpRight size={16} />
        </a>
      </section>

      {error ? (
        <p className={errorText}>{error}</p>
      ) : books === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${skeletonPulse} h-[74px]`} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={<BookOpen size={18} />} label={`Livre${books.length > 1 ? 's' : ''} publiés`} value={books.length} />
            <StatCard icon={<BookOpen size={18} />} label="Chapitres" value={totals.chapters} />
            <StatCard icon={<Eye size={18} />} label="Vues cumulées" value={totals.views} />
            <StatCard icon={<Heart size={18} />} label="J'aime" value={totals.likes} />
            <StatCard icon={<MessageCircle size={18} />} label="Avis" value={totals.comments} />
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Vos livres</h2>
              <a href="/espace-auteur/livres" className="text-sm font-medium text-brand-amber no-underline hover:underline">
                Tout voir →
              </a>
            </div>

            {books.length === 0 ? (
              <div className={`${glassPanel} p-10 text-center`}>
                <p className={emptyText}>Vous n'avez encore publié aucun livre.</p>
                <a
                  href="/espace-auteur/livres/nouveau"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-amber to-brand-pink px-5 py-2.5 text-sm font-semibold text-neutral-950 no-underline"
                >
                  Publier votre premier livre <ArrowUpRight size={16} />
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {books.slice(0, 6).map((book) => (
                  <a
                    key={book.id}
                    href={`/espace-auteur/livres/${book.id}`}
                    className={`${glassPanel} ${glassPanelHover} group flex items-center gap-3.5 p-3.5 no-underline`}
                  >
                    {book.cover ? (
                      <img src={book.cover} alt="" className="h-[68px] w-[46px] shrink-0 rounded-lg object-cover shadow-lg" />
                    ) : (
                      <span className="flex h-[68px] w-[46px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-amber to-brand-pink text-lg font-bold text-neutral-950">
                        {book.title.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white group-hover:text-brand-amber">{book.title}</p>
                      <p className="mt-1 text-[0.72rem] text-white/40">
                        {book._count.chapters} chap. · {book.viewStats?.viewCount ?? 0} vues · {book._count.likes} ♥
                      </p>
                    </div>
                    <ArrowUpRight size={16} className="shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-amber" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
