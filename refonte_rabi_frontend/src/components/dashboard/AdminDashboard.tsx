'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeEuro,
  Bell,
  BookOpen,
  ChevronRight,
  CircleUserRound,
  Crown,
  FileText,
  Gift,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Users,
} from 'lucide-react';
import { apiClient, extractApiErrorMessage } from '@/lib/api-client';
import { useLogout, useSession } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { AdminKycSection } from './admin/AdminKycSection';
import { AdminBookGrantSection } from './admin/AdminBookGrantSection';
import { AdminCatalogueSection } from './admin/AdminCatalogueSection';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import type { ApiResponse } from '@/types/api';

type Section = 'pilotage' | 'utilisateurs' | 'catalogue' | 'transactions' | 'book-grants' | 'moderation' | 'kyc' | 'parametres';

interface AdminData {
  revenue: number;
  counts: {
    users: number;
    authors: number;
    books: number;
    chapters: number;
    purchases: number;
    reviews: number;
    likes: number;
    shares: number;
    carts: number;
  };
  recentUsers: Array<{ id: number; name: string | null; email: string; isAdmin: boolean; isActive: boolean; createdAt: string }>;
  recentBooks: Array<{
    id: number;
    title: string;
    slug: string;
    cover: string;
    datePub: string;
    isFree: boolean;
    price: number;
    author: { name: string | null; email: string };
  }>;
}

const navItems: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'pilotage', label: 'Pilotage', icon: LayoutDashboard },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { id: 'catalogue', label: 'Catalogue', icon: BookOpen },
  { id: 'transactions', label: 'Transactions', icon: BadgeEuro },
  { id: 'book-grants', label: 'Attribuer un livre', icon: Gift },
  { id: 'moderation', label: 'Modération', icon: MessageCircle },
  { id: 'kyc', label: 'Vérification KYC', icon: ShieldCheck },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

const formatNumber = new Intl.NumberFormat('fr-FR');
const formatMoney = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 });
const ADMIN_SECTION_STORAGE_KEY = 'rabipek-admin-active-section';

export function AdminDashboard() {
  const router = useRouter();
  const logout = useLogout();
  const { data: user, isLoading: isLoadingSession } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState<Section>(() => {
    if (typeof window === 'undefined') return 'pilotage';
    const stored = window.localStorage.getItem(ADMIN_SECTION_STORAGE_KEY);
    return navItems.some((item) => item.id === stored) ? (stored as Section) : 'pilotage';
  });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  function selectSection(nextSection: Section) {
    setSection(nextSection);
    window.localStorage.setItem(ADMIN_SECTION_STORAGE_KEY, nextSection);
  }

  const dashboard = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AdminData>>('/users/administration/tableau-de-bord');
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: user?.role === 'admin',
  });

  useEffect(() => {
    if (isLoadingSession) return;
    if (!user) router.replace('/connexion');
    else if (user.role !== 'admin') router.replace(user.role === 'author' ? '/espace-auteur' : '/tableau-de-bord');
  }, [isLoadingSession, router, user]);

  const currentLabel = useMemo(() => navItems.find((item) => item.id === section)?.label ?? '', [section]);

  if (isLoadingSession || !user || user.role !== 'admin') return <div className="min-h-screen bg-background" />;

  const data = dashboard.data;

  const renderSection = () => {
    if (dashboard.isLoading) return <div className="h-80 animate-pulse rounded-[2rem] bg-black/[0.04] dark:bg-white/[0.06]" />;
    if (dashboard.isError || !data) {
      return (
        <p className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-600 dark:text-rose-100">
          {extractApiErrorMessage(dashboard.error, 'Impossible de charger les données d’administration.')}
        </p>
      );
    }

    if (section === 'utilisateurs') {
      return (
        <Panel
          title="Utilisateurs récents"
          description={`${formatNumber.format(data.counts.users)} comptes et ${formatNumber.format(data.counts.authors)} auteurs dans la plateforme.`}
        >
          <div className="divide-y divide-black/5 dark:divide-white/7">
            {data.recentUsers.map((account) => (
              <div key={account.id} className="flex items-center gap-3 py-3">
                <Avatar name={account.name ?? account.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{account.name ?? 'Compte sans nom'}</p>
                  <p className="truncate text-xs text-black/45 dark:text-white/45">{account.email}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    account.isAdmin
                      ? 'bg-amber-300/15 text-amber-600 dark:text-amber-100'
                      : 'bg-black/5 text-black/60 dark:bg-white/7 dark:text-white/60'
                  }`}
                >
                  {account.isAdmin ? 'Administrateur' : account.isActive ? 'Actif' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      );
    }

    if (section === 'catalogue') return <AdminCatalogueSection />;
    if ((section as Section) === 'catalogue') {
      return (
        <Panel
          title="Catalogue récent"
          description={`${formatNumber.format(data.counts.books)} livres et ${formatNumber.format(data.counts.chapters)} chapitres publiés.`}
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {data.recentBooks.map((book) => (
              <Link
                key={book.id}
                href={`/livres/${book.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-black/8 bg-black/[0.02] p-3 transition hover:border-sky-400/35 hover:bg-black/[0.04] dark:border-white/8 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-300 to-violet-500 font-bold text-neutral-950">
                  {book.title.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{book.title}</p>
                  <p className="mt-0.5 truncate text-xs text-black/45 dark:text-white/45">{book.author.name ?? book.author.email}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-black/30 dark:text-white/30" />
              </Link>
            ))}
          </div>
        </Panel>
      );
    }

    if (section === 'transactions') {
      return (
        <Panel title="Transactions" description="Vue consolidée des achats et du panier.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Chiffre d’affaires" value={formatMoney.format(data.revenue)} icon={BadgeEuro} />
            <Metric label="Achats" value={formatNumber.format(data.counts.purchases)} icon={FileText} />
            <Metric label="Paniers actifs" value={formatNumber.format(data.counts.carts)} icon={ShoppingBag} />
          </div>
          <p className="mt-5 text-sm text-black/45 dark:text-white/45">
            Le paiement et la gestion détaillée des transactions seront ajoutés à cette section.
          </p>
        </Panel>
      );
    }

    if (section === 'moderation') {
      return (
        <Panel title="Modération & engagement" description="Suivez les interactions de la communauté.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Commentaires" value={formatNumber.format(data.counts.reviews)} icon={MessageCircle} />
            <Metric label="Mentions J’aime" value={formatNumber.format(data.counts.likes)} icon={Heart} />
            <Metric label="Partages" value={formatNumber.format(data.counts.shares)} icon={Share2} />
          </div>
        </Panel>
      );
    }

    if (section === 'kyc') return <AdminKycSection />;

    if (section === 'book-grants') return <AdminBookGrantSection />;

    if (section === 'parametres') {
      return (
        <Panel title="Paramètres de la plateforme" description="Contrôle de votre session administrateur.">
          <div className="rounded-2xl border border-black/8 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.035]">
            <p className="text-xs text-black/45 dark:text-white/45">Session active</p>
            <p className="mt-1 font-medium">{user.email}</p>
            <p className="mt-5 text-sm text-black/45 dark:text-white/45">Les réglages globaux seront centralisés ici.</p>
          </div>
        </Panel>
      );
    }

    return (
      <>
        <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 p-6 text-white sm:p-9 dark:border-white/10">
          <div className="relative z-10 max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Crown size={17} /> Centre de pilotage
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">La plateforme sous contrôle.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/80">
              Supervisez l’audience, le catalogue et l’activité de Rabipek en temps réel.
            </p>
            <button
              type="button"
              onClick={() => selectSection('utilisateurs')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:scale-[1.02]"
            >
              Gérer les utilisateurs <ChevronRight size={16} />
            </button>
          </div>
          <div className="absolute -right-16 -bottom-24 size-80 rounded-full bg-white/20 blur-3xl" />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Utilisateurs" value={formatNumber.format(data.counts.users)} icon={Users} />
          <Metric label="Auteurs" value={formatNumber.format(data.counts.authors)} icon={CircleUserRound} />
          <Metric label="Livres" value={formatNumber.format(data.counts.books)} icon={BookOpen} />
          <Metric label="Chiffre d’affaires" value={formatMoney.format(data.revenue)} icon={BadgeEuro} />
        </section>

        <Panel title="Dernières publications" description="Les livres récemment ajoutés au catalogue.">
          <div className="grid gap-3 lg:grid-cols-2">
            {data.recentBooks.slice(0, 4).map((book) => (
              <Link
                key={book.id}
                href={`/livres/${book.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-black/8 bg-black/[0.02] p-3 dark:border-white/8 dark:bg-white/[0.035]"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400 font-bold text-neutral-950">
                  {book.title.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{book.title}</p>
                  <p className="truncate text-xs text-black/45 dark:text-white/45">{book.author.name ?? book.author.email}</p>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/8 bg-background/80 px-5 backdrop-blur-xl lg:px-8 dark:border-white/8">
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-600 text-sm text-white">R</span>
          Rabipek <span className="text-sm font-semibold text-sky-500 dark:text-sky-300">Admin</span>
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
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-sky-400" />
          </button>
          <Avatar name={user.email} />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-72 shrink-0 border-r border-black/8 px-4 py-7 lg:flex lg:flex-col dark:border-white/8">
          <p className="px-3 text-xs font-semibold tracking-[0.16em] text-black/35 uppercase dark:text-white/35">Administration</p>
          <nav className="mt-4 flex flex-col gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(id)}
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
          <div className="mb-6 flex items-center gap-2 text-sm text-black/40 lg:hidden dark:text-white/40">
            <Crown size={16} />
            {currentLabel}
          </div>
          <div className="flex flex-col gap-6">{renderSection()}</div>
        </main>
      <LogoutConfirmModal open={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} isSubmitting={logout.isPending} onConfirm={() => logout.mutate(undefined, { onSuccess: () => router.replace('/connexion') })} />
      </div>
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

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BookOpen }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-black/[0.02] p-4 dark:border-white/8 dark:bg-white/[0.035]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-black/45 dark:text-white/45">{label}</span>
        <Icon size={17} className="text-sky-500 dark:text-sky-200" />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-violet-500 text-sm font-bold text-neutral-950">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
