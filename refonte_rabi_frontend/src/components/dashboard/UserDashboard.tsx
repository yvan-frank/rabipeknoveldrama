'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BookMarked,
  BookOpen,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Share2,
  ShoppingBag,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { extractApiErrorMessage } from '@/lib/api-client';
import { useLogout, useSession } from '@/hooks/useAuth';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import { useTheme } from '@/hooks/useTheme';
import type { ApiResponse } from '@/types/api';

type Section = 'accueil' | 'bibliotheque' | 'favoris' | 'panier' | 'activite' | 'parametres';

interface DashboardBook {
  id: number;
  title: string;
  slug: string;
  cover: string;
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
  cart: Array<{ id: number; quantity: number | null; book: DashboardBook }>;
  purchases: Array<{ id: number; date: string; book: DashboardBook }>;
  recentReads: Array<{ id: number; chapterRead: number; readAt: string; book: DashboardBook }>;
  library: LibraryEntry[];
  likedBooks: Array<{ id: number; book: DashboardBook }>;
  counts: { cart: number; purchases: number; reads: number; likes: number; comments: number; shares: number };
}

const navItems: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'accueil', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { id: 'bibliotheque', label: 'Ma bibliothèque', icon: BookOpen },
  { id: 'favoris', label: 'Mes favoris', icon: Heart },
  { id: 'panier', label: 'Mon panier', icon: ShoppingBag },
  { id: 'activite', label: 'Mon activité', icon: MessageCircle },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

function BookList({ books, emptyText, actionLabel = 'Ouvrir' }: { books: DashboardBook[]; emptyText: string; actionLabel?: string }) {
  if (books.length === 0) return <p className="py-8 text-sm text-black/45 dark:text-white/45">{emptyText}</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => (
        <Link key={book.id} href={`/livres/${book.slug}`} className="group flex items-center gap-3 rounded-2xl border border-black/8 bg-black/[0.02] p-3 transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:bg-black/[0.04] dark:border-white/8 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-rose-500 text-sm font-bold text-neutral-950">
            {book.title.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{book.title}</p>
            <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">{actionLabel}</p>
          </div>
          <ChevronRight size={16} className="text-black/30 transition group-hover:translate-x-0.5 group-hover:text-amber-500 dark:text-white/30 dark:group-hover:text-amber-200" />
        </Link>
      ))}
    </div>
  );
}

// Contrairement à BookList (qui renvoie toujours vers la page livre), ici
// chaque carte pointe directement sur le chapitre où la lecture s'est
// arrêtée — c'est tout l'intérêt de "reprendre la lecture".
function ContinueReadingList({ reads, emptyText }: { reads: DashboardData['recentReads']; emptyText: string }) {
  if (reads.length === 0) return <p className="py-8 text-sm text-black/45 dark:text-white/45">{emptyText}</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {reads.map((read) => (
        <Link
          key={read.id}
          href={`/livres/${read.book.slug}/chapitres/${read.chapterRead}`}
          className="group flex items-center gap-3 rounded-2xl border border-black/8 bg-black/[0.02] p-3 transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:bg-black/[0.04] dark:border-white/8 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]"
        >
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-rose-500 text-sm font-bold text-neutral-950">
            {read.book.title.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{read.book.title}</p>
            <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">Chapitre {read.chapterRead} · reprendre la lecture</p>
          </div>
          <ChevronRight size={16} className="text-black/30 transition group-hover:translate-x-0.5 group-hover:text-amber-500 dark:text-white/30 dark:group-hover:text-amber-200" />
        </Link>
      ))}
    </div>
  );
}

// "Ma bibliothèque" : chaque livre acheté ou commencé, avec une barre de
// progression quand la lecture a débuté. Le clic reprend au bon chapitre
// (ou démarre au chapitre 1 si jamais entamé) — la page de lecture gère
// elle-même le verrouillage/paywall si besoin.
function LibraryList({ entries, emptyText }: { entries: LibraryEntry[]; emptyText: string }) {
  if (entries.length === 0) return <p className="py-8 text-sm text-black/45 dark:text-white/45">{emptyText}</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => {
        const progress = entry.chapterRead && entry.totalChapters > 0 ? Math.min(100, Math.round((entry.chapterRead / entry.totalChapters) * 100)) : 0;
        return (
          <Link
            key={entry.id}
            href={`/livres/${entry.book.slug}/chapitres/${entry.chapterRead ?? 1}`}
            className="group flex flex-col gap-3 rounded-2xl border border-black/8 bg-black/[0.02] p-3 transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:bg-black/[0.04] dark:border-white/8 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-rose-500 text-sm font-bold text-neutral-950">
                {entry.book.title.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.book.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/45 dark:text-white/45">
                  {entry.purchased && <span className="rounded-full bg-amber-300/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">Acheté</span>}
                  {!entry.purchased && entry.purchasedParts.length > 0 && <span className="rounded-full bg-amber-300/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">{entry.purchasedParts.length} partie{entry.purchasedParts.length > 1 ? 's' : ''} achetée{entry.purchasedParts.length > 1 ? 's' : ''}</span>}
                  {entry.chapterRead ? `Chapitre ${entry.chapterRead}/${entry.totalChapters}` : 'Pas encore commencé'}
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-black/30 transition group-hover:translate-x-0.5 group-hover:text-amber-500 dark:text-white/30 dark:group-hover:text-amber-200" />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-rose-500" style={{ width: `${progress}%` }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function UserDashboard() {
  const router = useRouter();
  const logout = useLogout();
  const { data: user, isLoading: isLoadingSession } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState<Section>('accueil');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const dashboard = useQuery({
    queryKey: ['user', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardData>>('/users/moi/tableau-de-bord');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: user?.role === 'user',
  });

  useEffect(() => {
    if (isLoadingSession) return;
    if (!user) router.replace('/connexion');
    else if (user.role !== 'user') router.replace(user.role === 'admin' ? '/administration' : '/espace-auteur');
  }, [isLoadingSession, router, user]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileNavOpen]);

  const data = dashboard.data;
  const currentLabel = useMemo(() => navItems.find((item) => item.id === section)?.label ?? '', [section]);
  if (isLoadingSession || !user || user.role !== 'user') return <div className="min-h-screen bg-background" />;

  const renderSection = () => {
    if (dashboard.isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-black/[0.04] dark:bg-white/[0.06]" />;
    if (dashboard.isError || !data) return <p className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-600 dark:text-rose-100">{extractApiErrorMessage(dashboard.error, 'Impossible de charger votre espace.')}</p>;
    if (section === 'bibliotheque') return <Panel title="Ma bibliothèque" description="Vos livres achetés ou entamés, avec votre progression de lecture."><LibraryList entries={data.library} emptyText="Commencez la lecture d'un livre pour le retrouver ici." /></Panel>;
    if (section === 'favoris') return <Panel title="Mes favoris" description="Les livres que vous souhaitez retrouver facilement."><BookList books={data.likedBooks.map((like) => like.book)} emptyText="Ajoutez un coup de cœur depuis le catalogue." /></Panel>;
    if (section === 'panier') return <Panel title="Mon panier" description="Vos prochaines lectures sont ici."><BookList books={data.cart.map((item) => item.book)} emptyText="Votre panier est vide." actionLabel="Voir le livre" /></Panel>;
    if (section === 'activite') return <Panel title="Mon activité" description="Votre empreinte dans la communauté Rabipek."><div className="grid gap-3 sm:grid-cols-3"><Metric label="Commentaires" value={data.counts.comments} icon={MessageCircle} /><Metric label="Partages" value={data.counts.shares} icon={Share2} /><Metric label="Lectures" value={data.counts.reads} icon={BookOpen} /></div></Panel>;
    if (section === 'parametres') return <Panel title="Paramètres du compte" description="Vos informations de connexion et préférences."><div className="rounded-2xl border border-black/8 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.035]"><p className="text-xs text-black/45 dark:text-white/45">Adresse e-mail</p><p className="mt-1 font-medium">{user.email}</p><p className="mt-5 text-sm text-black/50 dark:text-white/50">La modification du profil sera disponible prochainement.</p></div></Panel>;
    return <>
      <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br from-amber-300 via-amber-400 to-rose-500 p-6 text-neutral-950 sm:p-9 dark:border-white/10">
        <div className="relative z-10 max-w-xl"><p className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={17} /> Votre espace de lecture</p><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Bonjour, bienvenue dans votre prochain chapitre.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-neutral-900/75">Retrouvez vos livres, vos favoris et votre activité en un seul endroit.</p><Link href="/livres" className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]">Explorer le catalogue <ChevronRight size={16} /></Link></div><div className="absolute -right-12 -bottom-20 size-72 rounded-full bg-white/25 blur-3xl" /></section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Dans ma bibliothèque" value={data.counts.purchases} icon={BookMarked} /><Metric label="Coups de cœur" value={data.counts.likes} icon={Heart} /><Metric label="Dans mon panier" value={data.counts.cart} icon={ShoppingBag} /><Metric label="Interactions" value={data.counts.comments + data.counts.shares} icon={MessageCircle} /></section>
      <Panel title="Livres en cours de lecture" description="Reprenez exactement là où vous vous étiez arrêté."><ContinueReadingList reads={data.recentReads} emptyText="Commencez une lecture depuis le catalogue." /></Panel>
    </>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/8 bg-background/80 px-5 backdrop-blur-xl dark:border-white/8">
        <Link href="/" className="text-xl font-black tracking-tight">
          Rabi<span className="text-amber-500 dark:text-amber-300">pek</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            className="flex size-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-foreground/80 dark:border-white/10 dark:bg-white/[0.04]"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-foreground/80 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-amber-300" />
          </button>
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-rose-500 text-sm font-bold text-neutral-950">
            {user.email.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-72 shrink-0 border-r border-black/8 px-4 py-7 lg:flex lg:flex-col dark:border-white/8">
          <p className="px-3 text-xs font-semibold tracking-[0.16em] text-black/35 uppercase dark:text-white/35">Espace personnel</p>
          <nav className="mt-4 flex flex-col gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  section === id
                    ? 'bg-foreground text-background shadow-lg shadow-black/10 dark:shadow-white/10'
                    : 'text-black/60 hover:bg-black/[0.06] hover:text-foreground dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-black/55 hover:bg-rose-400/10 hover:text-rose-500 dark:text-white/55 dark:hover:text-rose-200"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-9 lg:px-10">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="mb-6 flex w-full items-center justify-between gap-2 rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3 text-sm lg:hidden dark:border-white/8 dark:bg-white/[0.035]"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard size={16} className="text-amber-500 dark:text-amber-300" />
              {currentLabel}
            </span>
            <ChevronRight size={16} className="text-black/40 dark:text-white/40" />
          </button>

          <div className="flex flex-col gap-6">{renderSection()}</div>
        </main>
      </div>

      <div
        aria-hidden
        onClick={() => setIsMobileNavOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation de l'espace personnel"
        className={`fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-black/10 bg-background p-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] shadow-2xl transition-transform duration-300 ease-out lg:hidden dark:border-white/10 ${
          isMobileNavOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs font-semibold tracking-[0.16em] text-black/35 uppercase dark:text-white/35">Espace personnel</p>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Fermer"
            className="flex size-8 items-center justify-center rounded-full border border-black/10 dark:border-white/10"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSection(id);
                setIsMobileNavOpen(false);
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                section === id
                  ? 'bg-foreground text-background'
                  : 'text-black/60 hover:bg-black/[0.06] dark:text-white/60 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-black/55 hover:bg-rose-400/10 hover:text-rose-500 dark:text-white/55 dark:hover:text-rose-200"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
      <LogoutConfirmModal open={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} isSubmitting={logout.isPending} onConfirm={() => logout.mutate(undefined, { onSuccess: () => router.replace('/connexion') })} />
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 sm:p-6 dark:border-white/8 dark:bg-white/[0.035]">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-black/45 dark:text-white/45">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
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
