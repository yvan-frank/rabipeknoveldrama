import { useEffect, useState, type ReactNode } from 'react';
import { apiClient, extractApiErrorMessage, logout } from '../lib/apiClient';
import { useRequireAuth } from '../lib/useRequireAuth';
import { getDashboardPath } from '../lib/dashboard';

interface DashboardBook {
  id: number;
  title: string;
  slug: string;
  cover: string | null;
}

interface LibraryEntry {
  id: number;
  book: DashboardBook;
  totalChapters: number;
  chapterRead: number | null;
  purchased: boolean;
  purchasedParts: string[];
}

interface DashboardData {
  cart: Array<{ id: number; book: DashboardBook }>;
  purchases: Array<{ id: number; date: string; book: DashboardBook }>;
  recentReads: Array<{ id: number; chapterRead: number; readAt: string; book: DashboardBook }>;
  library: LibraryEntry[];
  likedBooks: Array<{ id: number; book: DashboardBook }>;
  counts: { cart: number; purchases: number; reads: number; likes: number; comments: number; shares: number };
}

type Section = 'accueil' | 'bibliotheque' | 'favoris' | 'panier' | 'activite' | 'parametres';

const NAV_ITEMS: Array<{ id: Section; label: string }> = [
  { id: 'accueil', label: "Vue d'ensemble" },
  { id: 'bibliotheque', label: 'Ma bibliothèque' },
  { id: 'favoris', label: 'Mes favoris' },
  { id: 'panier', label: 'Mon panier' },
  { id: 'activite', label: 'Mon activité' },
  { id: 'parametres', label: 'Paramètres' },
];

function initial(book: DashboardBook): string {
  return book.title.slice(0, 1).toUpperCase();
}

const bookCardClass =
  'flex items-center gap-3 rounded-2xl border border-black/10 px-3 py-2.5 no-underline text-inherit hover:border-brand-amber dark:border-white/10';

function BookCard({ book, href, meta }: { book: DashboardBook; href: string; meta: string }) {
  return (
    <a href={href} className={bookCardClass}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber to-brand-pink font-bold text-neutral-900">
        {initial(book)}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">{book.title}</span>
        <span className="text-[0.7rem] opacity-55">{meta}</span>
      </span>
    </a>
  );
}

function BookGrid({ items, emptyText }: { items: Array<{ key: number; book: DashboardBook; href: string; meta: string }>; emptyText: string }) {
  if (items.length === 0) return <p className="opacity-60">{emptyText}</p>;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
      {items.map((item) => (
        <BookCard key={item.key} book={item.book} href={item.href} meta={item.meta} />
      ))}
    </div>
  );
}

function LibraryGrid({ entries, emptyText }: { entries: LibraryEntry[]; emptyText: string }) {
  if (entries.length === 0) return <p className="opacity-60">{emptyText}</p>;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
      {entries.map((entry) => {
        const progress = entry.chapterRead && entry.totalChapters > 0 ? Math.min(100, Math.round((entry.chapterRead / entry.totalChapters) * 100)) : 0;
        const status = entry.purchased
          ? 'Acheté'
          : entry.purchasedParts.length > 0
            ? `${entry.purchasedParts.length} partie${entry.purchasedParts.length > 1 ? 's' : ''} achetée${entry.purchasedParts.length > 1 ? 's' : ''}`
            : entry.chapterRead
              ? `Chapitre ${entry.chapterRead}/${entry.totalChapters}`
              : 'Pas encore commencé';
        return (
          <a key={entry.id} href={`/livres/${entry.book.slug}`} className={bookCardClass}>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-amber to-brand-pink font-bold text-neutral-900">
              {initial(entry.book)}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">{entry.book.title}</span>
              <span className="text-[0.7rem] opacity-55">{status}</span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <span className="block h-full bg-gradient-to-r from-brand-amber to-brand-pink" style={{ width: `${progress}%` }} />
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <span className="text-xs opacity-60">{label}</span>
      <strong className="text-[1.6rem]">{value}</strong>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border border-black/10 px-6 py-5 dark:border-white/10">
      <h2 className="m-0 text-[1.15rem]">{title}</h2>
      <p className="mt-1 mb-4 text-[0.8rem] opacity-60">{description}</p>
      <div>{children}</div>
    </section>
  );
}

// Équivalent de src/components/dashboard/UserDashboard.tsx — un seul appel
// (GET /users/moi/tableau-de-bord, réservé au rôle "user" côté API), navigué
// par onglets côté client puisque tout ici est déjà chargé en une fois.
export default function Dashboard() {
  const user = useRequireAuth('/tableau-de-bord');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('accueil');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    apiClient
      .get('/users/moi/tableau-de-bord')
      .then((res) => setData(res.data?.data ?? null))
      .catch((err) => setError(extractApiErrorMessage(err, 'Impossible de charger votre espace.')));
  }, []);

  // GET /users/moi/tableau-de-bord est réservé au rôle "user" côté API — un
  // auteur/admin connecté est renvoyé vers son propre espace plutôt que de
  // recevoir une 403 depuis l'appel ci-dessus.
  useEffect(() => {
    if (user && user.role !== 'user') {
      window.location.href = getDashboardPath(user.role);
    }
  }, [user]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      window.location.href = '/connexion';
    }
  }

  if (!user || user.role !== 'user') return null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 dark:border-white/10 dark:bg-neutral-950">
        <a href="/" className="shrink-0 text-[1.1rem] font-black text-inherit no-underline sm:text-[1.2rem]">
          Rabi<span className="text-brand-amber">pek</span>
        </a>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
          {user && <span className="hidden max-w-40 truncate text-[0.8rem] opacity-60 sm:inline">{user.email}</span>}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-block shrink-0 rounded-lg px-3.5 py-2 text-sm disabled:opacity-60 sm:px-5 sm:py-2.5"
          >
            {isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-black/10 p-3 md:w-60 md:flex-col md:border-r md:border-b-0 md:p-6 dark:border-white/10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-sm whitespace-nowrap ${
                section === item.id
                  ? 'bg-neutral-900 font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-none text-inherit hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 sm:px-7 sm:py-6">
          {error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : !data ? (
            <p className="opacity-60">Chargement…</p>
          ) : section === 'bibliotheque' ? (
            <Panel title="Ma bibliothèque" description="Vos livres achetés ou entamés, avec votre progression de lecture.">
              <LibraryGrid entries={data.library} emptyText="Commencez la lecture d'un livre pour le retrouver ici." />
            </Panel>
          ) : section === 'favoris' ? (
            <Panel title="Mes favoris" description="Les livres que vous souhaitez retrouver facilement.">
              <BookGrid
                items={data.likedBooks.map((l) => ({ key: l.id, book: l.book, href: `/livres/${l.book.slug}`, meta: 'Voir le livre' }))}
                emptyText="Ajoutez un coup de cœur depuis le catalogue."
              />
            </Panel>
          ) : section === 'panier' ? (
            <Panel title="Mon panier" description="Vos prochaines lectures sont ici.">
              <BookGrid
                items={data.cart.map((c) => ({ key: c.id, book: c.book, href: `/livres/${c.book.slug}`, meta: 'Voir le livre' }))}
                emptyText="Votre panier est vide."
              />
            </Panel>
          ) : section === 'activite' ? (
            <Panel title="Mon activité" description="Votre empreinte dans la communauté Rabipek.">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                <Metric label="Commentaires" value={data.counts.comments} />
                <Metric label="Partages" value={data.counts.shares} />
                <Metric label="Lectures" value={data.counts.reads} />
              </div>
            </Panel>
          ) : section === 'parametres' ? (
            <Panel title="Paramètres du compte" description="Vos informations de connexion et préférences.">
              <div>
                <span className="text-[0.8rem] opacity-60">Adresse e-mail</span>
                <p className="my-1">{user?.email}</p>
                <p className="my-1 opacity-60">La modification du profil sera disponible prochainement.</p>
              </div>
              <div className="mt-6 border-t border-black/10 pt-5 dark:border-white/10">
                <a href="/supprimer-mon-compte" className="text-sm font-semibold text-rose-600 no-underline hover:underline">
                  Supprimer mon compte
                </a>
              </div>
            </Panel>
          ) : (
            <>
              <section className="rounded-3xl bg-gradient-to-br from-brand-amber to-brand-pink p-5 text-neutral-900 sm:p-8">
                <p className="text-[0.85rem] font-semibold">✨ Votre espace de lecture</p>
                <h1 className="my-3 max-w-lg text-[clamp(1.6rem,3vw,2.4rem)]">Bonjour, bienvenue dans votre prochain chapitre.</h1>
                <p className="max-w-md opacity-80">Retrouvez vos livres, vos favoris et votre activité en un seul endroit.</p>
                <a href="/livres" className="mt-4 inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm text-white no-underline">
                  Explorer le catalogue →
                </a>
              </section>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                <Metric label="Dans ma bibliothèque" value={data.counts.purchases} />
                <Metric label="Coups de cœur" value={data.counts.likes} />
                <Metric label="Dans mon panier" value={data.counts.cart} />
                <Metric label="Interactions" value={data.counts.comments + data.counts.shares} />
              </div>

              <Panel title="Livres en cours de lecture" description="Reprenez exactement là où vous vous étiez arrêté.">
                <BookGrid
                  items={data.recentReads.map((r) => ({
                    key: r.id,
                    book: r.book,
                    href: `/livres/${r.book.slug}/chapitres/${r.chapterRead}`,
                    meta: `Chapitre ${r.chapterRead} · reprendre la lecture`,
                  }))}
                  emptyText="Commencez une lecture depuis le catalogue."
                />
              </Panel>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
